"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";
import { despesaSchema, receitaSchema } from "@/lib/validations/financeiro";

export type ActionState = { error: string | null; sucesso?: boolean };

export async function registrarReceita(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = receitaSchema.safeParse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") ?? "",
    valor: formData.get("valor"),
    data: formData.get("data"),
    formaPagamento: formData.get("formaPagamento") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  await requirePermission(ctx.empresaId, "receitas", "criar");

  const supabase = await createClient();
  const { error } = await supabase.from("receitas").insert({
    empresa_id: ctx.empresaId,
    origem: "manual",
    descricao: parsed.data.descricao,
    categoria: parsed.data.categoria || null,
    valor: parsed.data.valor,
    data: parsed.data.data,
    forma_pagamento: parsed.data.formaPagamento || null,
    criado_por: ctx.userId,
  });

  if (error) return { error: "Não foi possível registrar a receita." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "criar",
    recurso: "receitas",
    dadosNovos: parsed.data,
  });

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  return { error: null, sucesso: true };
}

export async function editarReceita(
  receitaId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = receitaSchema.safeParse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") ?? "",
    valor: formData.get("valor"),
    data: formData.get("data"),
    formaPagamento: formData.get("formaPagamento") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  await requirePermission(ctx.empresaId, "receitas", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("receitas")
    .update({
      descricao: parsed.data.descricao,
      categoria: parsed.data.categoria || null,
      valor: parsed.data.valor,
      data: parsed.data.data,
      forma_pagamento: parsed.data.formaPagamento || null,
    })
    .eq("id", receitaId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "receitas",
    registroId: receitaId,
    dadosNovos: parsed.data,
  });

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  return { error: null, sucesso: true };
}

export async function registrarDespesa(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = despesaSchema.safeParse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") ?? "",
    valor: formData.get("valor"),
    data: formData.get("data"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  await requirePermission(ctx.empresaId, "despesas", "criar");

  const supabase = await createClient();
  const { error } = await supabase.from("despesas").insert({
    empresa_id: ctx.empresaId,
    descricao: parsed.data.descricao,
    categoria: parsed.data.categoria || null,
    valor: parsed.data.valor,
    data: parsed.data.data,
    criado_por: ctx.userId,
  });

  if (error) return { error: "Não foi possível registrar a despesa." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "criar",
    recurso: "despesas",
    dadosNovos: parsed.data,
  });

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  return { error: null, sucesso: true };
}

export async function editarDespesa(
  despesaId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = despesaSchema.safeParse({
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") ?? "",
    valor: formData.get("valor"),
    data: formData.get("data"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  await requirePermission(ctx.empresaId, "despesas", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("despesas")
    .update({
      descricao: parsed.data.descricao,
      categoria: parsed.data.categoria || null,
      valor: parsed.data.valor,
      data: parsed.data.data,
    })
    .eq("id", despesaId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "despesas",
    registroId: despesaId,
    dadosNovos: parsed.data,
  });

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  return { error: null, sucesso: true };
}
