import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Ver docs/asaas.md para configurar a URL do webhook no painel do Asaas.
// O Asaas permite definir um "token de autenticacao" enviado no header
// asaas-access-token; validamos contra ASAAS_WEBHOOK_TOKEN quando configurado.

export async function POST(request: NextRequest) {
  const token = request.headers.get("asaas-access-token");
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const payload = await request.json();
  const supabase = createServiceClient();

  const { data: webhook } = await supabase
    .from("webhooks_pagamentos")
    .insert({ gateway: "asaas", evento_tipo: payload.event ?? null, payload })
    .select("id")
    .single();

  try {
    const cobranca = payload.payment;
    if (!cobranca?.id) {
      await marcarProcessado(supabase, webhook?.id, "ok");
      return NextResponse.json({ received: true });
    }

    const { data: pagamento } = await supabase
      .from("pagamentos")
      .select("id, agendamento_id, empresa_id, valor, forma_pagamento")
      .eq("transacao_id", cobranca.id)
      .maybeSingle();

    if (!pagamento) {
      await processarPagamentoSaas(supabase, cobranca.id, payload.event);
      await marcarProcessado(supabase, webhook?.id, "ok");
      return NextResponse.json({ received: true });
    }

    const statusPagos = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH"];
    const statusRecusados = ["PAYMENT_OVERDUE", "PAYMENT_DELETED"];

    if (statusPagos.includes(payload.event)) {
      await supabase
        .from("pagamentos")
        .update({ status: "pago", data_pagamento: new Date().toISOString() })
        .eq("id", pagamento.id);
      await supabase
        .from("agendamentos")
        .update({ status: "confirmado" })
        .eq("id", pagamento.agendamento_id);
      await supabase.from("receitas").insert({
        empresa_id: pagamento.empresa_id,
        origem: "agendamento",
        agendamento_id: pagamento.agendamento_id,
        pagamento_id: pagamento.id,
        categoria: "entrada",
        descricao: "Entrada confirmada (Asaas)",
        valor: pagamento.valor,
        forma_pagamento: pagamento.forma_pagamento,
      });
    } else if (statusRecusados.includes(payload.event)) {
      await supabase.from("pagamentos").update({ status: "recusado" }).eq("id", pagamento.id);
    }

    await marcarProcessado(supabase, webhook?.id, "ok");
    return NextResponse.json({ received: true });
  } catch (error) {
    await marcarProcessado(supabase, webhook?.id, "erro", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}

// Cobranca de assinatura da plataforma (empresa pagando o AgendaPro), não de
// entrada de agendamento. Identificada por não existir em `pagamentos` mas
// existir em `pagamentos_saas` com o mesmo transacao_id.
async function processarPagamentoSaas(
  supabase: ReturnType<typeof createServiceClient>,
  transacaoId: string,
  evento: string
) {
  const { data: pagamentoSaas } = await supabase
    .from("pagamentos_saas")
    .select("id, assinatura_id, empresa_id")
    .eq("transacao_id", transacaoId)
    .maybeSingle();

  if (!pagamentoSaas) return;

  const statusPagos = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH"];
  const statusRecusados = ["PAYMENT_OVERDUE", "PAYMENT_DELETED"];

  if (statusPagos.includes(evento)) {
    const novoVencimento = new Date(Date.now() + 30 * 86_400_000).toISOString();

    await supabase
      .from("pagamentos_saas")
      .update({ status: "pago", data_pagamento: new Date().toISOString() })
      .eq("id", pagamentoSaas.id);

    await supabase
      .from("assinaturas_saas")
      .update({
        status: "ativa",
        periodo_atual_inicio: new Date().toISOString(),
        periodo_atual_fim: novoVencimento,
      })
      .eq("id", pagamentoSaas.assinatura_id);

    await supabase
      .from("empresas")
      .update({ status_assinatura: "ativa", trial_expira_em: novoVencimento, ativa: true })
      .eq("id", pagamentoSaas.empresa_id);
  } else if (statusRecusados.includes(evento)) {
    await supabase.from("pagamentos_saas").update({ status: "falhou" }).eq("id", pagamentoSaas.id);
  }
}

async function marcarProcessado(
  supabase: ReturnType<typeof createServiceClient>,
  webhookId: string | undefined,
  status: "ok" | "erro",
  error?: unknown
) {
  if (!webhookId) return;
  await supabase.from("webhooks_pagamentos").update({ processado: true }).eq("id", webhookId);
  await supabase.from("logs_webhooks").insert({
    webhook_id: webhookId,
    status,
    erro: error instanceof Error ? error.message : error ? String(error) : null,
  });
}
