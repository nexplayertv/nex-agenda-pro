"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createServiceClient } from "@/lib/supabase/service";

export type ActionState = { error: string | null; sucesso?: boolean };

async function exigirSuperadmin() {
  const ctx = await getAuthContext();
  if (!ctx?.isSuperadmin) throw new Error("Acesso restrito ao superadmin.");
  return ctx;
}

export async function salvarPlano(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await exigirSuperadmin();
  } catch {
    return { error: "Acesso restrito." };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const trialDias = Number(formData.get("trialDias"));

  if (!nome) return { error: "Informe o nome do plano." };
  if (!Number.isInteger(trialDias) || trialDias < 0) {
    return { error: "Informe um número de dias de teste válido." };
  }

  const { error } = await createServiceClient()
    .from("planos_saas")
    .update({ nome, trial_dias: trialDias })
    .eq("ativo", true);

  if (error) return { error: "Não foi possível salvar o plano." };

  revalidatePath("/planos");
  return { error: null, sucesso: true };
}

type CicloValidado =
  | { ok: false; error: string }
  | { ok: true; nome: string; periodoDias: number; valor: number };

function validarCiclo(formData: FormData): CicloValidado {
  const nome = String(formData.get("nome") ?? "").trim();
  const periodoDias = Number(formData.get("periodoDias"));
  const valor = Number(formData.get("valor"));

  if (!nome) return { ok: false, error: "Informe o nome do ciclo." };
  if (!Number.isInteger(periodoDias) || periodoDias <= 0) {
    return { ok: false, error: "Informe uma quantidade de dias válida." };
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, error: "Informe um valor válido." };
  }

  return { ok: true, nome, periodoDias, valor };
}

export async function criarCiclo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await exigirSuperadmin();
  } catch {
    return { error: "Acesso restrito." };
  }

  const parsed = validarCiclo(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await createServiceClient().from("ciclos_cobranca_saas").insert({
    nome: parsed.nome,
    periodo_dias: parsed.periodoDias,
    valor: parsed.valor,
  });

  if (error) return { error: "Não foi possível criar o ciclo." };

  revalidatePath("/planos");
  return { error: null, sucesso: true };
}

export async function atualizarCiclo(
  cicloId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await exigirSuperadmin();
  } catch {
    return { error: "Acesso restrito." };
  }

  const parsed = validarCiclo(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await createServiceClient()
    .from("ciclos_cobranca_saas")
    .update({ nome: parsed.nome, periodo_dias: parsed.periodoDias, valor: parsed.valor })
    .eq("id", cicloId);

  if (error) return { error: "Não foi possível salvar o ciclo." };

  revalidatePath("/planos");
  return { error: null, sucesso: true };
}

export async function alternarCicloAtivo(cicloId: string, ativo: boolean): Promise<void> {
  try {
    await exigirSuperadmin();
  } catch {
    return;
  }

  await createServiceClient().from("ciclos_cobranca_saas").update({ ativo }).eq("id", cicloId);

  revalidatePath("/planos");
}
