"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { AsaasGateway } from "@/lib/payments/asaas";
import { descriptografarCredenciais } from "@/lib/payments/credentials";
import type { PaymentGateway } from "@/lib/payments/gateway";
import { MercadoPagoGateway } from "@/lib/payments/mercadopago";
import { StripeGateway } from "@/lib/payments/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type RenovarState = { error: string | null; urlPagamento?: string };
export type DocumentoState = { error: string | null; sucesso?: boolean };

export async function salvarDocumentoEmpresa(
  _prev: DocumentoState,
  formData: FormData
): Promise<DocumentoState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "configuracoes", "editar");

  const cnpjCpf = String(formData.get("cnpjCpf") ?? "").replace(/\D/g, "");
  if (cnpjCpf.length !== 11 && cnpjCpf.length !== 14) {
    return { error: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido." };
  }

  const nomeCompleto = String(formData.get("nomeCompleto") ?? "").trim();
  if (!nomeCompleto) {
    return { error: "Informe o nome completo." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresas")
    .update({ cnpj_cpf: cnpjCpf, nome_completo: nomeCompleto })
    .eq("id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/assinatura");
  return { error: null, sucesso: true };
}

function instanciarGateway(
  tipo: "asaas" | "stripe" | "mercadopago",
  apiKey: string,
  ambiente: string
): PaymentGateway {
  if (tipo === "asaas") {
    return new AsaasGateway(apiKey, ambiente === "producao" ? "https://api.asaas.com/v3" : undefined);
  }
  if (tipo === "stripe") return new StripeGateway(apiKey);
  return new MercadoPagoGateway(apiKey);
}

export async function renovarAssinatura(): Promise<RenovarState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const supabaseAdmin = createServiceClient();
  const { data: gatewayPlataforma } = await supabaseAdmin
    .from("credenciais_gateway_plataforma")
    .select("tipo, ambiente, dados_criptografados")
    .eq("principal", true)
    .maybeSingle();

  if (!gatewayPlataforma) {
    return {
      error:
        "Nenhum gateway de pagamento configurado para renovação. Peça para o administrador da plataforma configurar em Configurações da plataforma.",
    };
  }

  const supabase = await createClient();

  const [{ data: empresa }, { data: plano }, { data: assinatura }] = await Promise.all([
    supabase.from("empresas").select("nome, nome_completo, cnpj_cpf").eq("id", ctx.empresaId).single(),
    supabase.from("planos_saas").select("id, valor_mensal").eq("ativo", true).single(),
    supabase
      .from("assinaturas_saas")
      .select("id")
      .eq("empresa_id", ctx.empresaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!empresa || !plano) return { error: "Não foi possível carregar os dados do plano." };
  if (!empresa.cnpj_cpf || !empresa.nome_completo) {
    return {
      error:
        "Preencha o nome completo e o CPF ou CNPJ da empresa abaixo antes de renovar - o gateway exige esses dados.",
    };
  }

  // assinaturas_saas/pagamentos_saas so aceitam escrita do superadmin via
  // RLS (ver 0011_rls_policies.sql) - aqui e o proprio tenant pagando a
  // propria mensalidade, entao usamos a service role para essa escrita
  // pontual, com empresaId vindo do contexto autenticado (nao de input).
  let assinaturaId = assinatura?.id ?? null;
  if (!assinaturaId) {
    const { data: novaAssinatura, error: assinaturaError } = await supabaseAdmin
      .from("assinaturas_saas")
      .insert({ empresa_id: ctx.empresaId, plano_id: plano.id, status: "pagamento_pendente" })
      .select("id")
      .single();
    if (assinaturaError || !novaAssinatura) {
      return { error: "Não foi possível iniciar a renovação." };
    }
    assinaturaId = novaAssinatura.id;
  }

  const { apiKey } = descriptografarCredenciais(gatewayPlataforma.dados_criptografados);
  const gateway = instanciarGateway(
    gatewayPlataforma.tipo as "asaas" | "stripe" | "mercadopago",
    apiKey,
    gatewayPlataforma.ambiente
  );

  try {
    const cobranca = await gateway.criarCobranca({
      valor: Number(plano.valor_mensal),
      descricao: `Assinatura AgendaPro - ${empresa.nome}`,
      clienteNome: empresa.nome_completo,
      clienteEmail: ctx.email,
      clienteCpfCnpj: empresa.cnpj_cpf,
      referenciaExterna: `assinatura:${ctx.empresaId}`,
      billingType: "UNDEFINED",
      urlRetorno: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    await supabaseAdmin.from("pagamentos_saas").insert({
      assinatura_id: assinaturaId,
      empresa_id: ctx.empresaId,
      valor: Number(plano.valor_mensal),
      status: "pendente",
      gateway: gatewayPlataforma.tipo,
      transacao_id: cobranca.transacaoId,
    });

    if (!cobranca.urlPagamento) {
      return { error: "Cobrança criada, mas o link de pagamento não veio do gateway." };
    }

    return { error: null, urlPagamento: cobranca.urlPagamento };
  } catch {
    return { error: "Não foi possível gerar a cobrança agora. Tente novamente em instantes." };
  }
}
