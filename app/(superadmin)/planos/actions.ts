"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createServiceClient } from "@/lib/supabase/service";

export type ActionState = { error: string | null; sucesso?: boolean };

export async function salvarPlano(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.isSuperadmin) return { error: "Acesso restrito." };

  const nome = String(formData.get("nome") ?? "").trim();
  const valorMensal = Number(formData.get("valorMensal"));
  const trialDias = Number(formData.get("trialDias"));

  if (!nome) return { error: "Informe o nome do plano." };
  if (!Number.isFinite(valorMensal) || valorMensal <= 0) {
    return { error: "Informe um valor mensal válido." };
  }
  if (!Number.isInteger(trialDias) || trialDias < 0) {
    return { error: "Informe um número de dias de teste válido." };
  }

  const { error } = await createServiceClient()
    .from("planos_saas")
    .update({ nome, valor_mensal: valorMensal, trial_dias: trialDias })
    .eq("ativo", true);

  if (error) return { error: "Não foi possível salvar o plano." };

  revalidatePath("/planos");
  return { error: null, sucesso: true };
}
