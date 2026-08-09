"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { AsaasGateway } from "@/lib/payments/asaas";
import { descriptografarCredenciais, encriptarCredenciais } from "@/lib/payments/credentials";
import { MercadoPagoGateway } from "@/lib/payments/mercadopago";
import { StripeGateway } from "@/lib/payments/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export type GatewayPlataformaTipo = "asaas" | "stripe" | "mercadopago";
export type ActionState = { error: string | null; sucesso?: boolean };

async function exigirSuperadmin() {
  const ctx = await getAuthContext();
  if (!ctx?.isSuperadmin) throw new Error("Acesso restrito ao superadmin.");
  return ctx;
}

export async function salvarCredencialGatewayPlataforma(
  tipo: GatewayPlataformaTipo,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await exigirSuperadmin();
  } catch {
    return { error: "Acesso restrito." };
  }

  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const ambiente = String(formData.get("ambiente") ?? "producao");
  if (!apiKey) return { error: "Informe a chave de API." };

  const supabaseAdmin = createServiceClient();
  const credenciaisCriptografadas = encriptarCredenciais({ apiKey });

  const { data: existente } = await supabaseAdmin
    .from("credenciais_gateway_plataforma")
    .select("id")
    .eq("tipo", tipo)
    .maybeSingle();

  const { error } = existente
    ? await supabaseAdmin
        .from("credenciais_gateway_plataforma")
        .update({ ambiente, status: "conectado", dados_criptografados: credenciaisCriptografadas })
        .eq("id", existente.id)
    : await supabaseAdmin.from("credenciais_gateway_plataforma").insert({
        tipo,
        ambiente,
        status: "conectado",
        dados_criptografados: credenciaisCriptografadas,
      });

  if (error) return { error: "Não foi possível salvar a chave." };

  revalidatePath("/configuracoes-plataforma");
  return { error: null, sucesso: true };
}

export async function testarConexaoGatewayPlataforma(
  tipo: GatewayPlataformaTipo
): Promise<{ ok: boolean; mensagem: string }> {
  try {
    await exigirSuperadmin();
  } catch {
    return { ok: false, mensagem: "Acesso restrito." };
  }

  const supabaseAdmin = createServiceClient();
  const { data: credencial } = await supabaseAdmin
    .from("credenciais_gateway_plataforma")
    .select("id, ambiente, dados_criptografados")
    .eq("tipo", tipo)
    .maybeSingle();

  if (!credencial) return { ok: false, mensagem: "Nenhuma credencial salva." };

  const { apiKey } = descriptografarCredenciais(credencial.dados_criptografados);
  const instancia =
    tipo === "asaas"
      ? new AsaasGateway(apiKey, credencial.ambiente === "producao" ? "https://api.asaas.com/v3" : undefined)
      : tipo === "stripe"
        ? new StripeGateway(apiKey)
        : new MercadoPagoGateway(apiKey);

  const resultado = await instancia.testarConexao();

  await supabaseAdmin
    .from("credenciais_gateway_plataforma")
    .update({
      status: resultado.ok ? "ativo" : "erro_conexao",
      ultima_sincronizacao_em: new Date().toISOString(),
    })
    .eq("id", credencial.id);

  revalidatePath("/configuracoes-plataforma");
  return resultado;
}

export async function definirGatewayPrincipalPlataforma(tipo: GatewayPlataformaTipo): Promise<void> {
  try {
    await exigirSuperadmin();
  } catch {
    return;
  }

  const supabaseAdmin = createServiceClient();
  await supabaseAdmin.from("credenciais_gateway_plataforma").update({ principal: false }).neq("tipo", tipo);
  await supabaseAdmin.from("credenciais_gateway_plataforma").update({ principal: true }).eq("tipo", tipo);

  revalidatePath("/configuracoes-plataforma");
}

export async function desconectarGatewayPlataforma(tipo: GatewayPlataformaTipo): Promise<void> {
  try {
    await exigirSuperadmin();
  } catch {
    return;
  }

  const supabaseAdmin = createServiceClient();
  await supabaseAdmin.from("credenciais_gateway_plataforma").delete().eq("tipo", tipo);

  revalidatePath("/configuracoes-plataforma");
}
