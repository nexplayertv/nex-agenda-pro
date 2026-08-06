"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { AsaasGateway } from "@/lib/payments/asaas";
import { descriptografarCredenciais, encriptarCredenciais } from "@/lib/payments/credentials";
import { MercadoPagoGateway } from "@/lib/payments/mercadopago";
import { StripeGateway } from "@/lib/payments/stripe";
import { createClient } from "@/lib/supabase/server";

export type GatewayAutomaticoTipo = "asaas" | "stripe" | "mercadopago";
export type ActionState = { error: string | null; sucesso?: boolean };

async function obterOuCriarGateway(
  supabase: Awaited<ReturnType<typeof createClient>>,
  empresaId: string,
  tipo: "pix_proprio" | GatewayAutomaticoTipo
) {
  const { data: existente } = await supabase
    .from("gateways_empresas")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("tipo", tipo)
    .maybeSingle();

  if (existente) return existente.id;

  const { data: criado } = await supabase
    .from("gateways_empresas")
    .insert({ empresa_id: empresaId, tipo })
    .select("id")
    .single();

  return criado?.id;
}

export async function salvarChavePix(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "gateways", "editar");

  const tipoChave = String(formData.get("tipoChave") ?? "");
  const chave = String(formData.get("chave") ?? "").trim();
  const nomeTitular = String(formData.get("nomeTitular") ?? "").trim();
  const nomeBanco = String(formData.get("nomeBanco") ?? "").trim();
  const cidadeRecebedor = String(formData.get("cidadeRecebedor") ?? "").trim();
  const contaTipo = String(formData.get("contaTipo") ?? "pessoal");
  const mensagemOrientacao = String(formData.get("mensagemOrientacao") ?? "").trim();
  const prazoPagamentoMinutos = Number(formData.get("prazoPagamentoMinutos") ?? 60);
  const prazoComprovanteMinutos = Number(formData.get("prazoComprovanteMinutos") ?? 60);

  if (!chave || !nomeTitular || !nomeBanco || !cidadeRecebedor) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("chaves_pix")
    .select("id")
    .eq("empresa_id", ctx.empresaId)
    .maybeSingle();

  const dados = {
    tipo_chave: tipoChave,
    chave,
    nome_titular: nomeTitular,
    nome_banco: nomeBanco,
    cidade_recebedor: cidadeRecebedor,
    conta_tipo: contaTipo,
    mensagem_orientacao: mensagemOrientacao || null,
    prazo_pagamento_minutos: prazoPagamentoMinutos,
    prazo_comprovante_minutos: prazoComprovanteMinutos,
  };

  if (existente) {
    await supabase.from("chaves_pix").update(dados).eq("id", existente.id);
  } else {
    await supabase.from("chaves_pix").insert({ empresa_id: ctx.empresaId, ...dados });
  }

  const gatewayId = await obterOuCriarGateway(supabase, ctx.empresaId, "pix_proprio");
  if (gatewayId) {
    await supabase
      .from("gateways_empresas")
      .update({ status: "ativo", ultima_sincronizacao_em: new Date().toISOString() })
      .eq("id", gatewayId);
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "gateways",
    dadosNovos: { tipo: "pix_proprio" },
  });

  revalidatePath("/gateways");
  return { error: null, sucesso: true };
}

export async function alternarPixAtivo(ativo: boolean): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "gateways", "editar");

  const supabase = await createClient();
  await supabase
    .from("gateways_empresas")
    .update({ status: ativo ? "ativo" : "inativo" })
    .eq("empresa_id", ctx.empresaId)
    .eq("tipo", "pix_proprio");

  revalidatePath("/gateways");
}

export async function salvarCredencialGateway(
  tipo: GatewayAutomaticoTipo,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "gateways", "editar");

  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const ambiente = String(formData.get("ambiente") ?? "sandbox");
  if (!apiKey) return { error: "Informe a chave de API." };

  const supabase = await createClient();
  const gatewayId = await obterOuCriarGateway(supabase, ctx.empresaId, tipo);
  if (!gatewayId) return { error: "Não foi possível salvar a configuração." };

  const credenciaisCriptografadas = encriptarCredenciais({ apiKey });

  const { data: existente } = await supabase
    .from("credenciais_gateways")
    .select("gateway_empresa_id")
    .eq("gateway_empresa_id", gatewayId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("credenciais_gateways")
      .update({ dados_criptografados: credenciaisCriptografadas })
      .eq("gateway_empresa_id", gatewayId);
  } else {
    await supabase
      .from("credenciais_gateways")
      .insert({ gateway_empresa_id: gatewayId, dados_criptografados: credenciaisCriptografadas });
  }

  await supabase
    .from("gateways_empresas")
    .update({ ambiente, status: "conectado" })
    .eq("id", gatewayId);

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "gateways",
    dadosNovos: { tipo, ambiente },
  });

  revalidatePath("/gateways");
  return { error: null, sucesso: true };
}

export async function testarConexaoGateway(
  tipo: GatewayAutomaticoTipo
): Promise<{ ok: boolean; mensagem: string }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { ok: false, mensagem: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "gateways", "editar");

  const supabase = await createClient();
  const { data: gateway } = await supabase
    .from("gateways_empresas")
    .select("id, ambiente")
    .eq("empresa_id", ctx.empresaId)
    .eq("tipo", tipo)
    .maybeSingle();

  if (!gateway) return { ok: false, mensagem: "Gateway ainda não configurado." };

  const { data: credencial } = await supabase
    .from("credenciais_gateways")
    .select("dados_criptografados")
    .eq("gateway_empresa_id", gateway.id)
    .maybeSingle();

  if (!credencial) return { ok: false, mensagem: "Nenhuma credencial salva." };

  const { apiKey } = descriptografarCredenciais(credencial.dados_criptografados);
  const instancia =
    tipo === "asaas"
      ? new AsaasGateway(apiKey, gateway.ambiente === "producao" ? "https://api.asaas.com/v3" : undefined)
      : tipo === "stripe"
        ? new StripeGateway(apiKey)
        : new MercadoPagoGateway(apiKey);

  const resultado = await instancia.testarConexao();

  await supabase
    .from("gateways_empresas")
    .update({
      status: resultado.ok ? "ativo" : "erro_conexao",
      ultima_sincronizacao_em: new Date().toISOString(),
    })
    .eq("id", gateway.id);

  revalidatePath("/gateways");
  return resultado;
}

export async function definirGatewayPrincipal(
  tipo: GatewayAutomaticoTipo
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "gateways", "editar");

  const supabase = await createClient();

  // Pagamentos ja criados guardam o proprio gateway em pagamentos.gateway,
  // entao trocar o principal aqui nao afeta cobrancas ja emitidas.
  await supabase
    .from("gateways_empresas")
    .update({ principal: false })
    .eq("empresa_id", ctx.empresaId)
    .in("tipo", ["asaas", "stripe", "mercadopago"]);

  const { error } = await supabase
    .from("gateways_empresas")
    .update({ principal: true })
    .eq("empresa_id", ctx.empresaId)
    .eq("tipo", tipo);

  if (error) return { error: "Não foi possível definir o gateway principal." };

  revalidatePath("/gateways");
  return { error: null };
}

export async function desconectarGateway(tipo: GatewayAutomaticoTipo): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "gateways", "editar");

  const supabase = await createClient();
  const { data: gateway } = await supabase
    .from("gateways_empresas")
    .select("id")
    .eq("empresa_id", ctx.empresaId)
    .eq("tipo", tipo)
    .maybeSingle();

  if (!gateway) return;

  await supabase.from("credenciais_gateways").delete().eq("gateway_empresa_id", gateway.id);
  await supabase
    .from("gateways_empresas")
    .update({ status: "nao_configurado", principal: false })
    .eq("id", gateway.id);

  revalidatePath("/gateways");
}
