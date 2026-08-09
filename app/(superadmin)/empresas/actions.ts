"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { createServiceClient } from "@/lib/supabase/service";

export type ActionState = { error: string | null };

async function exigirSuperadmin() {
  const ctx = await getAuthContext();
  if (!ctx?.isSuperadmin) throw new Error("Acesso restrito ao superadmin.");
  return ctx;
}

export async function renovarManualmente(empresaId: string): Promise<ActionState> {
  const ctx = await exigirSuperadmin().catch(() => null);
  if (!ctx) return { error: "Acesso restrito." };

  const supabase = createServiceClient();
  const { data: empresa } = await supabase
    .from("empresas")
    .select("trial_expira_em")
    .eq("id", empresaId)
    .single();

  if (!empresa) return { error: "Empresa não encontrada." };

  const agora = Date.now();
  const vencimentoAtual = empresa.trial_expira_em
    ? new Date(empresa.trial_expira_em).getTime()
    : agora;
  const novoVencimento = new Date(Math.max(agora, vencimentoAtual) + 30 * 86_400_000).toISOString();

  const { error } = await supabase
    .from("empresas")
    .update({ status_assinatura: "ativa", trial_expira_em: novoVencimento })
    .eq("id", empresaId);

  if (error) return { error: "Não foi possível renovar." };

  await registrarAtividade({
    empresaId,
    usuarioId: ctx.userId,
    cargoNome: "superadmin",
    acao: "renovar_manual",
    recurso: "empresas",
    registroId: empresaId,
    dadosNovos: { trial_expira_em: novoVencimento },
  });

  revalidatePath("/empresas");
  return { error: null };
}

export async function alternarAtivaEmpresa(empresaId: string, ativa: boolean): Promise<ActionState> {
  const ctx = await exigirSuperadmin().catch(() => null);
  if (!ctx) return { error: "Acesso restrito." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("empresas").update({ ativa }).eq("id", empresaId);

  if (error) return { error: "Não foi possível atualizar o acesso." };

  await registrarAtividade({
    empresaId,
    usuarioId: ctx.userId,
    cargoNome: "superadmin",
    acao: ativa ? "ativar" : "desativar",
    recurso: "empresas",
    registroId: empresaId,
  });

  revalidatePath("/empresas");
  return { error: null };
}

export async function excluirEmpresa(empresaId: string): Promise<ActionState> {
  const ctx = await exigirSuperadmin().catch(() => null);
  if (!ctx) return { error: "Acesso restrito." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("empresas").delete().eq("id", empresaId);

  if (error) return { error: "Não foi possível excluir a empresa." };

  revalidatePath("/empresas");
  return { error: null };
}
