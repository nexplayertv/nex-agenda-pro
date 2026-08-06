import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { descriptografarCredenciais } from "@/lib/payments/credentials";
import { createServiceClient } from "@/lib/supabase/service";

// Ver docs/mercadopago.md. O Mercado Pago manda uma notificacao leve
// (so o id do pagamento) - por seguranca, NUNCA confiamos no status que
// vier no corpo: sempre buscamos o pagamento de novo na API deles, usando
// a credencial da propria empresa, antes de confirmar qualquer coisa.

function assinaturaValida(request: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // validacao e opcional (nao configurada)

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  let ts: string | undefined;
  let hash: string | undefined;
  for (const parte of xSignature.split(",")) {
    const [chave, valor] = parte.split("=").map((v) => v.trim());
    if (chave === "ts") ts = valor;
    if (chave === "v1") hash = valor;
  }
  if (!ts || !hash) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(hash));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const payload = await request.json().catch(() => ({}));

  const dataId: string | null =
    payload?.data?.id != null ? String(payload.data.id) : url.searchParams.get("data.id");

  const supabase = createServiceClient();
  const { data: webhook } = await supabase
    .from("webhooks_pagamentos")
    .insert({ gateway: "mercadopago", evento_tipo: payload?.type ?? null, payload })
    .select("id")
    .single();

  if (!dataId || payload?.type !== "payment") {
    await marcarProcessado(supabase, webhook?.id, "ok");
    return NextResponse.json({ received: true });
  }

  if (!assinaturaValida(request, dataId)) {
    await marcarProcessado(supabase, webhook?.id, "erro", "Assinatura invalida");
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  try {
    const { data: pagamento } = await supabase
      .from("pagamentos")
      .select("id, agendamento_id, empresa_id, valor, forma_pagamento")
      .eq("transacao_id", dataId)
      .maybeSingle();

    if (!pagamento) {
      await marcarProcessado(supabase, webhook?.id, "ok");
      return NextResponse.json({ received: true });
    }

    const { data: gateway } = await supabase
      .from("gateways_empresas")
      .select("id")
      .eq("empresa_id", pagamento.empresa_id)
      .eq("tipo", "mercadopago")
      .maybeSingle();

    const { data: credencial } = gateway
      ? await supabase
          .from("credenciais_gateways")
          .select("dados_criptografados")
          .eq("gateway_empresa_id", gateway.id)
          .maybeSingle()
      : { data: null };

    if (!credencial) {
      await marcarProcessado(supabase, webhook?.id, "erro", "Credencial nao encontrada");
      return NextResponse.json({ error: "Credencial não encontrada" }, { status: 200 });
    }

    const { apiKey } = descriptografarCredenciais(credencial.dados_criptografados);
    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const pagamentoMp = await resposta.json();

    if (pagamentoMp.status === "approved") {
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
        descricao: "Entrada confirmada (Mercado Pago)",
        valor: pagamento.valor,
        forma_pagamento: pagamento.forma_pagamento,
      });
      await supabase.from("notificacoes").insert({
        empresa_id: pagamento.empresa_id,
        tipo: "pagamento_aprovado",
        titulo: "Pagamento confirmado",
        mensagem: "Um pagamento via Mercado Pago foi confirmado automaticamente.",
        link: "/agenda",
      });
    } else if (["rejected", "cancelled"].includes(pagamentoMp.status)) {
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
