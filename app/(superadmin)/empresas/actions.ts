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

export async function definirVencimento(empresaId: string, novaData: string): Promise<ActionState> {
  const ctx = await exigirSuperadmin().catch(() => null);
  if (!ctx) return { error: "Acesso restrito." };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
    return { error: "Data inválida." };
  }

  const novoVencimento = new Date(`${novaData}T23:59:59`).toISOString();

  const { error } = await createServiceClient()
    .from("empresas")
    .update({ status_assinatura: "ativa", trial_expira_em: novoVencimento })
    .eq("id", empresaId);

  if (error) return { error: "Não foi possível salvar a data." };

  await registrarAtividade({
    empresaId,
    usuarioId: ctx.userId,
    cargoNome: "superadmin",
    acao: "editar_vencimento",
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

export type RedefinirSenhaAdminState = { error: string | null; email?: string };

export async function redefinirSenhaAdministrador(
  empresaId: string
): Promise<RedefinirSenhaAdminState> {
  const ctx = await exigirSuperadmin().catch(() => null);
  if (!ctx) return { error: "Acesso restrito." };

  const supabase = createServiceClient();
  const { data: membros } = await supabase
    .from("usuarios_empresas")
    .select("usuarios(email), cargos(cargo_base)")
    .eq("empresa_id", empresaId)
    .eq("status", "ativo");

  const administrador = (
    membros as unknown as { usuarios: { email: string } | null; cargos: { cargo_base: string } | null }[] | null
  )?.find((m) => m.cargos?.cargo_base === "administrador");

  const email = administrador?.usuarios?.email;
  if (!email) {
    return { error: "Nenhum administrador ativo encontrado para essa empresa." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/redefinir-senha`,
  });

  if (error) return { error: "Não foi possível enviar o link de redefinição." };

  await registrarAtividade({
    empresaId,
    usuarioId: ctx.userId,
    cargoNome: "superadmin",
    acao: "redefinir_senha_admin",
    recurso: "empresas",
    registroId: empresaId,
  });

  return { error: null, email };
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
