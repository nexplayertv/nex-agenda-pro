"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { definirSenhaSchema } from "@/lib/validations/funcionarios";

export type RedefinirSenhaState = { error: string | null };

export async function redefinirSenha(
  _prev: RedefinirSenhaState,
  formData: FormData
): Promise<RedefinirSenhaState> {
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
    return { error: "Sessão de redefinição inválida ou expirada. Solicite um novo link." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) {
    return { error: "Não foi possível redefinir a senha." };
  }

  redirect("/dashboard");
}
