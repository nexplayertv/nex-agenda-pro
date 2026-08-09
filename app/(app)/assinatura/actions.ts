"use server";

import { getAuthContext } from "@/lib/permissions/auth-context";
import { AsaasGateway } from "@/lib/payments/asaas";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type RenovarState = { error: string | null; urlPagamento?: string };

export async function renovarAssinatura(): Promise<RenovarState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const apiKey = process.env.ASAAS_PLATFORM_API_KEY;
  if (!apiKey) {
    return { error: "Renovação automática ainda não está configurada. Fale com o suporte." };
  }

  const supabase = await createClient();

  const [{ data: empresa }, { data: plano }, { data: assinatura }] = await Promise.all([
    supabase.from("empresas").select("nome").eq("id", ctx.empresaId).single(),
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

  // assinaturas_saas/pagamentos_saas so aceitam escrita do superadmin via
  // RLS (ver 0011_rls_policies.sql) - aqui e o proprio tenant pagando a
  // propria mensalidade, entao usamos a service role para essa escrita
  // pontual, com empresaId vindo do contexto autenticado (nao de input).
  const supabaseAdmin = createServiceClient();

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

  // Sem UI de ambiente aqui (so existe uma conta, a da propria plataforma) -
  // usa producao por padrao; ASAAS_PLATFORM_SANDBOX=true muda pra sandbox
  // durante testes.
  const baseUrl =
    process.env.ASAAS_PLATFORM_SANDBOX === "true"
      ? "https://sandbox.asaas.com/api/v3"
      : "https://api.asaas.com/v3";
  const gateway = new AsaasGateway(apiKey, baseUrl);

  try {
    const cobranca = await gateway.criarCobranca({
      valor: Number(plano.valor_mensal),
      descricao: `Assinatura AgendaPro - ${empresa.nome}`,
      clienteNome: empresa.nome,
      clienteEmail: ctx.email,
      referenciaExterna: `assinatura:${ctx.empresaId}`,
      billingType: "UNDEFINED",
    });

    await supabaseAdmin.from("pagamentos_saas").insert({
      assinatura_id: assinaturaId,
      empresa_id: ctx.empresaId,
      valor: Number(plano.valor_mensal),
      status: "pendente",
      gateway: "asaas",
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
