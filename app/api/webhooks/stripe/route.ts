import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

// Ver docs/stripe.md para configurar o endpoint no painel da Stripe e
// obter o STRIPE_WEBHOOK_SECRET usado para validar a assinatura.

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const corpo = await request.text();

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 400 });
  }

  let evento: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    evento = stripe.webhooks.constructEvent(corpo, signature, secret);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: webhook } = await supabase
    .from("webhooks_pagamentos")
    .insert({ gateway: "stripe", evento_tipo: evento.type, payload: evento as unknown as object })
    .select("id")
    .single();

  try {
    if (evento.type === "checkout.session.completed") {
      const session = evento.data.object as Stripe.Checkout.Session;

      const { data: pagamento } = await supabase
        .from("pagamentos")
        .select("id, agendamento_id, empresa_id, valor, forma_pagamento")
        .eq("transacao_id", session.id)
        .maybeSingle();

      if (pagamento) {
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
          descricao: "Entrada confirmada (Stripe)",
          valor: pagamento.valor,
          forma_pagamento: pagamento.forma_pagamento,
        });
      }
    }

    if (webhook?.id) {
      await supabase.from("webhooks_pagamentos").update({ processado: true }).eq("id", webhook.id);
      await supabase.from("logs_webhooks").insert({ webhook_id: webhook.id, status: "ok" });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (webhook?.id) {
      await supabase.from("logs_webhooks").insert({
        webhook_id: webhook.id,
        status: "erro",
        erro: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
