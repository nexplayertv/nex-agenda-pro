"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { definirSenhaSchema } from "@/lib/validations/funcionarios";

export type DefinirSenhaState = { error: string | null };

export async function definirSenhaConvite(
  token: string,
  _prev: DefinirSenhaState,
  formData: FormData
): Promise<DefinirSenhaState> {
  const parsed = definirSenhaSchema.safeParse({
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique a senha informada." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão de convite inválida ou expirada. Peça um novo convite." };
  }

  const { error: senhaError } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (senhaError) {
    return { error: "Não foi possível definir a senha." };
  }

  const { error: aceitarError } = await supabase.rpc("aceitar_convite_funcionario", {
    p_token: token,
  });

  if (aceitarError) {
    return { error: aceitarError.message || "Não foi possível concluir o convite." };
  }

  redirect("/dashboard");
}
