"use server";

import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { alterarSenhaSchema } from "@/lib/validations/auth";

export type AlterarSenhaState = { error: string | null; sucesso?: boolean };

export async function alterarSenha(
  _prev: AlterarSenhaState,
  formData: FormData
): Promise<AlterarSenhaState> {
  const parsed = alterarSenhaSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  const ctx = await getAuthContext();
  if (!ctx) return { error: "Sessão inválida." };

  const supabase = await createClient();

  // Confirma a senha atual reautenticando antes de trocar - updateUser()
  // sozinho nao pede a senha atual, entao sem isso qualquer sessao aberta
  // (ex.: computador compartilhado) poderia trocar a senha sem saber a
  // atual.
  const { error: erroLogin } = await supabase.auth.signInWithPassword({
    email: ctx.email,
    password: parsed.data.senhaAtual,
  });

  if (erroLogin) {
    return { error: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.novaSenha });
  if (error) {
    return { error: "Não foi possível alterar a senha." };
  }

  return { error: null, sucesso: true };
}
