"use server";

import { revalidatePath } from "next/cache";
import { getSlotsDisponiveis } from "@/lib/agenda/disponibilidade";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";
import { novoAgendamentoSchema, novoClienteRapidoSchema } from "@/lib/validations/agendamentos";

export type ActionState = { error: string | null; sucesso?: boolean };

export async function buscarSlotsAction(
  profissionalId: string,
  servicoId: string,
  data: string
): Promise<string[]> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return [];

  const supabase = await createClient();
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_minutos")
    .eq("id", servicoId)
    .single();

  if (!servico) return [];

  return getSlotsDisponiveis(supabase, {
    empresaId: ctx.empresaId,
    profissionalId,
    data,
    duracaoMinutos: servico.duracao_minutos,
  });
}

export async function criarClienteRapido(
  nome: string,
  whatsapp: string
): Promise<{ id: string } | { error: string }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = novoClienteRapidoSchema.safeParse({ nome, whatsapp });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await requirePermission(ctx.empresaId, "clientes", "criar");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ empresa_id: ctx.empresaId, nome: parsed.data.nome, whatsapp: parsed.data.whatsapp || null })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível cadastrar o cliente." };
  return { id: data.id };
}

export async function criarAgendamento(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = novoAgendamentoSchema.safeParse({
    clienteId: formData.get("clienteId"),
    servicoId: formData.get("servicoId"),
    profissionalId: formData.get("profissionalId"),
    data: formData.get("data"),
    horaInicio: formData.get("horaInicio"),
    observacoes: formData.get("observacoes") ?? "",
    formaPagamento: formData.get("formaPagamento"),
    marcarComoPago: formData.get("marcarComoPago"),
    liberarSemPagamento: formData.get("liberarSemPagamento"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "agendamentos", "criar");

  const {
    clienteId,
    servicoId,
    profissionalId,
    data,
    horaInicio,
    observacoes,
    formaPagamento,
    marcarComoPago,
    liberarSemPagamento,
  } = parsed.data;

  const supabase = await createClient();

  const [{ data: servico }, { data: config }] = await Promise.all([
    supabase.from("servicos").select("valor, duracao_minutos").eq("id", servicoId).single(),
    supabase
      .from("configuracoes_empresas")
      .select("percentual_entrada")
      .eq("empresa_id", ctx.empresaId)
      .single(),
  ]);

  if (!servico || !config) return { error: "Serviço ou configuração não encontrados." };

  const slots = await getSlotsDisponiveis(supabase, {
    empresaId: ctx.empresaId,
    profissionalId,
    data,
    duracaoMinutos: servico.duracao_minutos,
  });

  if (!slots.includes(horaInicio)) {
    return { error: "Esse horário não está mais disponível. Escolha outro." };
  }

  const [h, m] = horaInicio.split(":").map(Number);
  const fimMinutos = h * 60 + m + servico.duracao_minutos;
  const horaFim = `${Math.floor(fimMinutos / 60)
    .toString()
    .padStart(2, "0")}:${(fimMinutos % 60).toString().padStart(2, "0")}`;

  const valorTotal = Number(servico.valor);
  const percentual = config.percentual_entrada;
  const valorEntrada = Math.round(valorTotal * (percentual / 100) * 100) / 100;
  const valorRestante = Math.round((valorTotal - valorEntrada) * 100) / 100;

  const statusInicial = liberarSemPagamento || marcarComoPago ? "confirmado" : "aguardando_pagamento";

  const { data: agendamento, error } = await supabase
    .from("agendamentos")
    .insert({
      empresa_id: ctx.empresaId,
      cliente_id: clienteId,
      servico_id: servicoId,
      profissional_id: profissionalId,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      status: statusInicial,
      valor_total: valorTotal,
      percentual_entrada_aplicado: percentual,
      valor_entrada: valorEntrada,
      valor_restante: valorRestante,
      forma_pagamento: formaPagamento,
      origem: "admin",
      observacoes: observacoes || null,
      criado_por: ctx.userId,
      liberado_sem_pagamento: liberarSemPagamento,
      liberado_por: liberarSemPagamento ? ctx.userId : null,
    })
    .select("id")
    .single();

  if (error || !agendamento) {
    return { error: "Não foi possível criar o agendamento. O horário pode ter acabado de ser ocupado." };
  }

  if (!liberarSemPagamento) {
    const { data: pagamento } = await supabase
      .from("pagamentos")
      .insert({
        empresa_id: ctx.empresaId,
        agendamento_id: agendamento.id,
        tipo: "entrada",
        valor: valorEntrada,
        forma_pagamento: formaPagamento,
        status: marcarComoPago ? "pago" : "pendente",
        data_pagamento: marcarComoPago ? new Date().toISOString() : null,
        confirmado_por: marcarComoPago ? ctx.userId : null,
        confirmado_em: marcarComoPago ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (marcarComoPago) {
      await supabase.from("receitas").insert({
        empresa_id: ctx.empresaId,
        origem: "agendamento",
        agendamento_id: agendamento.id,
        pagamento_id: pagamento?.id,
        categoria: "entrada",
        descricao: "Entrada do agendamento",
        valor: valorEntrada,
        forma_pagamento: formaPagamento,
        criado_por: ctx.userId,
      });
      await supabase.from("notificacoes").insert({
        empresa_id: ctx.empresaId,
        tipo: "pagamento_aprovado",
        titulo: "Pagamento confirmado",
        mensagem: "Um pagamento de entrada foi confirmado e o agendamento está garantido.",
        link: "/agenda",
      });
    }
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "criar",
    recurso: "agendamentos",
    registroId: agendamento.id,
    dadosNovos: { liberarSemPagamento, marcarComoPago, statusInicial },
  });

  if (liberarSemPagamento) {
    await registrarAtividade({
      empresaId: ctx.empresaId,
      usuarioId: ctx.userId,
      cargoNome: ctx.cargoNome,
      acao: "liberar_sem_pagamento",
      recurso: "agendamentos",
      registroId: agendamento.id,
    });
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  return { error: null, sucesso: true };
}

export async function editarAgendamento(
  agendamentoId: string,
  params: { profissionalId: string; data: string; horaInicio: string; observacoes: string }
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "agendamentos", "editar");

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("agendamentos")
    .select("profissional_id, data, hora_inicio, hora_fim, servico_id")
    .eq("id", agendamentoId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  if (!atual) return { error: "Agendamento não encontrado." };

  const mudouHorario =
    atual.profissional_id !== params.profissionalId ||
    atual.data !== params.data ||
    atual.hora_inicio.slice(0, 5) !== params.horaInicio;

  let horaFim = atual.hora_fim;

  if (mudouHorario) {
    const { data: servico } = await supabase
      .from("servicos")
      .select("duracao_minutos")
      .eq("id", atual.servico_id)
      .single();
    if (!servico) return { error: "Serviço não encontrado." };

    const slots = await getSlotsDisponiveis(supabase, {
      empresaId: ctx.empresaId,
      profissionalId: params.profissionalId,
      data: params.data,
      duracaoMinutos: servico.duracao_minutos,
    });
    if (!slots.includes(params.horaInicio)) {
      return { error: "Esse horário não está disponível. Escolha outro." };
    }
    const [h, m] = params.horaInicio.split(":").map(Number);
    const fimMinutos = h * 60 + m + servico.duracao_minutos;
    horaFim = `${Math.floor(fimMinutos / 60)
      .toString()
      .padStart(2, "0")}:${(fimMinutos % 60).toString().padStart(2, "0")}`;
  }

  const { error } = await supabase
    .from("agendamentos")
    .update({
      profissional_id: params.profissionalId,
      data: params.data,
      hora_inicio: params.horaInicio,
      hora_fim: horaFim,
      observacoes: params.observacoes || null,
    })
    .eq("id", agendamentoId)
    .eq("empresa_id", ctx.empresaId);

  if (error) {
    return { error: "Não foi possível salvar. O horário pode ter sido ocupado nesse meio-tempo." };
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "agendamentos",
    registroId: agendamentoId,
    dadosNovos: params,
  });

  revalidatePath("/agenda");
  return { error: null };
}

async function mudarStatus(
  agendamentoId: string,
  novoStatus: string,
  acaoAuditoria: string,
  extra?: Record<string, unknown>
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "agendamentos", "confirmar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("agendamentos")
    .update({ status: novoStatus, ...extra })
    .eq("id", agendamentoId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível atualizar o status." };

  if (novoStatus === "cancelado" || novoStatus === "nao_compareceu") {
    await supabase.from("notificacoes").insert({
      empresa_id: ctx.empresaId,
      tipo: novoStatus === "cancelado" ? "cancelamento" : "cliente_nao_compareceu",
      titulo: novoStatus === "cancelado" ? "Agendamento cancelado" : "Cliente não compareceu",
      mensagem:
        novoStatus === "cancelado"
          ? "Um agendamento foi cancelado."
          : "Um cliente foi marcado como não comparecido.",
      link: "/agenda",
    });
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: acaoAuditoria,
    recurso: "agendamentos",
    registroId: agendamentoId,
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function confirmarAgendamento(id: string) {
  return mudarStatus(id, "confirmado", "confirmar");
}

export async function iniciarAtendimento(id: string) {
  return mudarStatus(id, "em_atendimento", "iniciar_atendimento");
}

export async function marcarNaoCompareceu(id: string) {
  return mudarStatus(id, "nao_compareceu", "marcar_nao_compareceu");
}

export async function cancelarAgendamento(id: string, motivo: string) {
  return mudarStatus(id, "cancelado", "cancelar", {
    cancelado_em: new Date().toISOString(),
    cancelado_motivo: motivo || null,
  });
}

export async function finalizarAtendimento(id: string): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "agendamentos", "confirmar");

  const supabase = await createClient();
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("valor_restante, profissional_id, forma_pagamento, status")
    .eq("id", id)
    .eq("empresa_id", ctx.empresaId)
    .single();

  if (!agendamento) return { error: "Agendamento não encontrado." };

  const { error } = await supabase
    .from("agendamentos")
    .update({
      status: "finalizado",
      finalizado_em: new Date().toISOString(),
      finalizado_por: ctx.userId,
    })
    .eq("id", id)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível finalizar o atendimento." };

  if (Number(agendamento.valor_restante) > 0) {
    await supabase.from("receitas").insert({
      empresa_id: ctx.empresaId,
      origem: "agendamento",
      agendamento_id: id,
      categoria: "restante",
      descricao: "Valor restante pago na finalização",
      valor: agendamento.valor_restante,
      forma_pagamento: agendamento.forma_pagamento ?? "outro",
      criado_por: ctx.userId,
    });
  }

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("comissao_percentual")
    .eq("id", agendamento.profissional_id)
    .single();

  if (profissional?.comissao_percentual) {
    const { data: agendamentoCompleto } = await supabase
      .from("agendamentos")
      .select("valor_total")
      .eq("id", id)
      .single();

    if (agendamentoCompleto) {
      const valorComissao =
        Math.round(Number(agendamentoCompleto.valor_total) * (profissional.comissao_percentual / 100) * 100) /
        100;

      await supabase.from("comissoes").insert({
        empresa_id: ctx.empresaId,
        profissional_id: agendamento.profissional_id,
        agendamento_id: id,
        tipo_calculo: "percentual",
        base_calculo: "valor_total",
        percentual: profissional.comissao_percentual,
        valor: valorComissao,
        status: "disponivel",
        data_disponivel: new Date().toISOString().slice(0, 10),
      });
    }
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "finalizar",
    recurso: "agendamentos",
    registroId: id,
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  revalidatePath("/comissoes");
  return { error: null };
}
