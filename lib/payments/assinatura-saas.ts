import "server-only";

import type { createServiceClient } from "@/lib/supabase/service";

// Usado pelos 3 webhooks (asaas/stripe/mercadopago) quando a cobranca
// confirmada e de assinatura da PLATAFORMA (empresa pagando o AgendaPro),
// identificada por existir em pagamentos_saas mas nao em pagamentos.

export async function confirmarPagamentoSaas(
  supabase: ReturnType<typeof createServiceClient>,
  pagamentoSaasId: string,
  assinaturaId: string,
  empresaId: string
) {
  // Empilha a partir do vencimento atual quando ele ainda nao passou (ex.:
  // renovacao antecipada, antes do vencimento), em vez de sempre resetar
  // pra "hoje + 30 dias" - senao renovar cedo desperdicaria os dias que
  // ja tinham sido pagos e ainda nao foram usados.
  const { data: empresaAtual } = await supabase
    .from("empresas")
    .select("trial_expira_em")
    .eq("id", empresaId)
    .single();

  const agora = Date.now();
  const vencimentoAtual = empresaAtual?.trial_expira_em
    ? new Date(empresaAtual.trial_expira_em).getTime()
    : agora;
  const baseRenovacao = Math.max(agora, vencimentoAtual);
  const novoVencimento = new Date(baseRenovacao + 30 * 86_400_000).toISOString();

  await supabase
    .from("pagamentos_saas")
    .update({ status: "pago", data_pagamento: new Date().toISOString() })
    .eq("id", pagamentoSaasId);

  await supabase
    .from("assinaturas_saas")
    .update({
      status: "ativa",
      periodo_atual_inicio: new Date().toISOString(),
      periodo_atual_fim: novoVencimento,
    })
    .eq("id", assinaturaId);

  // "ativa" NAO e tocada aqui de proposito: e um interruptor administrativo
  // independente do superadmin (ver empresas/actions.ts), pagamento nao deve
  // reverter uma suspensao manual.
  await supabase
    .from("empresas")
    .update({ status_assinatura: "ativa", trial_expira_em: novoVencimento })
    .eq("id", empresaId);
}

export async function recusarPagamentoSaas(
  supabase: ReturnType<typeof createServiceClient>,
  pagamentoSaasId: string
) {
  await supabase.from("pagamentos_saas").update({ status: "falhou" }).eq("id", pagamentoSaasId);
}
