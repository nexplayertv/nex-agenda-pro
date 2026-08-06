"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";

export async function obterUrlComprovante(
  caminho: string
): Promise<{ url: string | null; error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { url: null, error: "Sessão inválida." };

  try {
    await requirePermission(ctx.empresaId, "comprovantes_pix", "visualizar");
  } catch {
    return { url: null, error: "Você não tem permissão para ver comprovantes." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("comprovantes")
    .createSignedUrl(caminho, 60 * 5);

  if (error) {
    console.error("obterUrlComprovante", error);
    return { url: null, error: "Não foi possível abrir o comprovante. Tente novamente." };
  }
  return { url: data.signedUrl, error: null };
}

export async function confirmarPagamentoPix(
  pagamentoId: string
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "comprovantes_pix", "confirmar");

  const supabase = await createClient();
  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("id, agendamento_id, valor, forma_pagamento")
    .eq("id", pagamentoId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  if (!pagamento) return { error: "Pagamento não encontrado." };

  const agora = new Date().toISOString();

  // Rodadas em sequencia (nao em Promise.all) de proposito: escritas
  // concorrentes usando a mesma instancia do client server-side do
  // Supabase estavam perdendo operacoes silenciosamente em producao.
  const passos = [
    () =>
      supabase
        .from("pagamentos")
        .update({
          status: "pago",
          data_pagamento: agora,
          confirmado_por: ctx.userId,
          confirmado_em: agora,
        })
        .eq("id", pagamentoId),
    () =>
      supabase
        .from("agendamentos")
        .update({ status: "confirmado" })
        .eq("id", pagamento.agendamento_id),
    () =>
      supabase
        .from("reservas_temporarias")
        .update({ status: "convertida" })
        .eq("agendamento_id", pagamento.agendamento_id),
    () =>
      supabase.from("receitas").insert({
        empresa_id: ctx.empresaId,
        origem: "agendamento",
        agendamento_id: pagamento.agendamento_id,
        pagamento_id: pagamento.id,
        categoria: "entrada",
        descricao: "Entrada confirmada (Pix)",
        valor: pagamento.valor,
        forma_pagamento: pagamento.forma_pagamento,
        criado_por: ctx.userId,
      }),
    () =>
      supabase.from("notificacoes").insert({
        empresa_id: ctx.empresaId,
        tipo: "pagamento_aprovado",
        titulo: "Pagamento confirmado",
        mensagem: "Um pagamento de entrada foi confirmado e o agendamento está garantido.",
        link: "/agenda",
      }),
  ];

  for (const passo of passos) {
    const { error } = await passo();
    if (error) console.error("confirmarPagamentoPix: falha parcial", error);
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "confirmar",
    recurso: "comprovantes_pix",
    registroId: pagamentoId,
  });

  revalidatePath("/pagamentos-entrada");
  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  return { error: null };
}

export async function recusarComprovante(
  pagamentoId: string,
  motivo: string
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "comprovantes_pix", "cancelar");

  const supabase = await createClient();
  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("id, agendamento_id")
    .eq("id", pagamentoId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  if (!pagamento) return { error: "Pagamento não encontrado." };

  const { data: comprovante } = await supabase
    .from("comprovantes_pagamentos")
    .select("id")
    .eq("pagamento_id", pagamentoId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("pagamentos").update({ status: "pendente" }).eq("id", pagamentoId);
  await supabase
    .from("agendamentos")
    .update({ status: "aguardando_comprovante" })
    .eq("id", pagamento.agendamento_id);
  if (comprovante) {
    await supabase
      .from("comprovantes_pagamentos")
      .update({
        status: "recusado",
        motivo_recusa: motivo || null,
        analisado_por: ctx.userId,
        analisado_em: new Date().toISOString(),
      })
      .eq("id", comprovante.id);
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "recusar_comprovante",
    recurso: "comprovantes_pix",
    registroId: pagamentoId,
    dadosNovos: { motivo },
  });

  revalidatePath("/pagamentos-entrada");
  return { error: null };
}

export async function cancelarReservaExpirada(agendamentoId: string): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "agendamentos", "cancelar");

  const supabase = await createClient();
  await supabase
    .from("agendamentos")
    .update({ status: "cancelado", cancelado_em: new Date().toISOString() })
    .eq("id", agendamentoId)
    .eq("empresa_id", ctx.empresaId);
  await supabase
    .from("reservas_temporarias")
    .update({ status: "cancelada" })
    .eq("agendamento_id", agendamentoId);

  revalidatePath("/pagamentos-entrada");
}
