import "server-only";

import Stripe from "stripe";
import type {
  CriarCobrancaInput,
  CriarCobrancaResultado,
  PaymentGateway,
  StatusCobranca,
} from "./gateway";

const STATUS_MAP: Record<string, StatusCobranca> = {
  requires_payment_method: "pendente",
  requires_confirmation: "pendente",
  requires_action: "pendente",
  processing: "pendente",
  succeeded: "pago",
  canceled: "cancelado",
};

export class StripeGateway implements PaymentGateway {
  private readonly client: Stripe;

  constructor(secretKey: string, private readonly stripeAccountId?: string) {
    this.client = new Stripe(secretKey);
  }

  private options(): Stripe.RequestOptions {
    return this.stripeAccountId ? { stripeAccount: this.stripeAccountId } : {};
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResultado> {
    const session = await this.client.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              unit_amount: Math.round(input.valor * 100),
              product_data: { name: input.descricao },
            },
            quantity: 1,
          },
        ],
        customer_email: input.clienteEmail || undefined,
        client_reference_id: input.referenciaExterna,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/agendar/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/agendar`,
      },
      this.options()
    );

    return {
      transacaoId: session.id,
      urlPagamento: session.url ?? undefined,
    };
  }

  async consultarStatus(transacaoId: string): Promise<StatusCobranca> {
    const session = await this.client.checkout.sessions.retrieve(transacaoId, {}, this.options());
    if (session.payment_status === "paid") return "pago";
    if (session.status === "expired") return "cancelado";
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) return "pendente";
    const intent = await this.client.paymentIntents.retrieve(paymentIntentId, {}, this.options());
    return STATUS_MAP[intent.status] ?? "pendente";
  }

  async reembolsar(transacaoId: string): Promise<void> {
    const session = await this.client.checkout.sessions.retrieve(transacaoId, {}, this.options());
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) throw new Error("Pagamento não encontrado para reembolso.");
    await this.client.refunds.create({ payment_intent: paymentIntentId }, this.options());
  }

  async testarConexao(): Promise<{ ok: boolean; mensagem: string }> {
    try {
      await this.client.balance.retrieve({}, this.options());
      return { ok: true, mensagem: "Conexão com a Stripe estabelecida com sucesso." };
    } catch (error) {
      return { ok: false, mensagem: error instanceof Error ? error.message : "Falha na conexão." };
    }
  }
}
