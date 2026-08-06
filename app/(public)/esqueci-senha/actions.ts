"use server";

import { createClient } from "@/lib/supabase/server";
import { esqueciSenhaSchema } from "@/lib/validations/auth";

export type EsqueciSenhaState = { error: string | null; sucesso: boolean };

export async function solicitarRedefinicao(
  _prev: EsqueciSenhaState,
  formData: FormData
): Promise<EsqueciSenhaState> {
  const parsed = esqueciSenhaSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido.", sucesso: false };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/redefinir-senha`,
  });

  // Sempre responde com sucesso, mesmo se o e-mail nao existir, para nao
  // revelar quais e-mails estao cadastrados na plataforma.
  return { error: null, sucesso: true };
}
