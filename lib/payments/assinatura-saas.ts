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
  const novoVencimento = new Date(Date.now() + 30 * 86_400_000).toISOString();

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

  await supabase
    .from("empresas")
    .update({ status_assinatura: "ativa", trial_expira_em: novoVencimento, ativa: true })
    .eq("id", empresaId);
}

export async function recusarPagamentoSaas(
  supabase: ReturnType<typeof createServiceClient>,
  pagamentoSaasId: string
) {
  await supabase.from("pagamentos_saas").update({ status: "falhou" }).eq("id", pagamentoSaasId);
}
