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
