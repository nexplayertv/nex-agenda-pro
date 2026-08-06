"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils-domain/slug";
import { cadastroSchema, loginSchema } from "@/lib/validations/auth";

export type AuthActionState = { error: string | null };

export async function entrar(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/dashboard");
}

export async function cadastrar(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = cadastroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    nomeEmpresa: formData.get("nomeEmpresa"),
    segmento: formData.get("segmento"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, email, senha, nomeEmpresa, segmento } = parsed.data;
  const supabase = await createClient();

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (signUpError) {
    return { error: signUpError.message || "Não foi possível criar a conta." };
  }

  // signUp ja autentica a sessao quando a confirmacao de e-mail esta
  // desativada no projeto Supabase (padrao recomendado em docs/setup.md
  // para o ambiente de testes).
  const slugBase = slugify(nomeEmpresa) || "empresa";
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

  const { error: onboardingError } = await supabase.rpc("criar_empresa_onboarding", {
    p_nome_empresa: nomeEmpresa,
    p_slug: slug,
    p_segmento: segmento,
  });

  if (onboardingError) {
    return {
      error:
        "Conta criada, mas não foi possível configurar a empresa automaticamente. Confirme seu e-mail e faça login para tentar novamente.",
    };
  }

  redirect("/dashboard");
}

export async function sair(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Sem redirect() aqui de proposito: esta acao e chamada via onClick a
  // partir de um menu (nao um <form>), e o redirect() do servidor nesse
  // contexto nao e interceptado direito pelo client - quem navega e o
  // componente que chama sair(), depois que a promise resolve.
}
