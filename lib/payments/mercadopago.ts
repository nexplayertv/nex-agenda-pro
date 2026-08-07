import "server-only";

import { randomUUID } from "node:crypto";
import {
  GatewayValidationError,
  type CriarCobrancaInput,
  type CriarCobrancaResultado,
  type PaymentGateway,
  type StatusCobranca,
} from "./gateway";

const STATUS_MAP: Record<string, StatusCobranca> = {
  approved: "pago",
  pending: "pendente",
  in_process: "pendente",
  authorized: "pendente",
  rejected: "recusado",
  cancelled: "cancelado",
  refunded: "reembolsado",
  charged_back: "reembolsado",
};

function extrairDescricaoErro(corpoJson: string): string | null {
  try {
    const corpo = JSON.parse(corpoJson) as {
      message?: string;
      cause?: { description?: string }[];
    };
    return corpo.cause?.[0]?.description ?? corpo.message ?? null;
  } catch {
    return null;
  }
}

type PagamentoMercadoPago = {
  id: number;
  status: string;
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string };
  };
};

export class MercadoPagoGateway implements PaymentGateway {
  constructor(private readonly accessToken: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.mercadopago.com${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const corpo = await response.text();
      if (response.status === 400) {
        const descricao = extrairDescricaoErro(corpo);
        if (descricao) throw new GatewayValidationError(descricao);
      }
      throw new Error(`Mercado Pago: ${response.status} - ${corpo}`);
    }

    return response.json() as Promise<T>;
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResultado> {
    // O Mercado Pago exige e-mail do pagador para gerar cobranca Pix. Como
    // o formulario publico so pede e-mail como opcional, usamos um endereco
    // "de sistema" quando o cliente nao informou - nao e usado para
    // contato de verdade, so satisfaz a validacao da API.
    const email = input.clienteEmail || `sem-email+${randomUUID()}@agendapro.app`;

    const pagamento = await this.request<PagamentoMercadoPago>("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": randomUUID() },
      body: JSON.stringify({
        transaction_amount: input.valor,
        description: input.descricao,
        payment_method_id: "pix",
        external_reference: input.referenciaExterna,
        payer: {
          email,
          first_name: input.clienteNome.split(" ")[0],
        },
      }),
    });

    const dadosPix = pagamento.point_of_interaction?.transaction_data;

    return {
      transacaoId: String(pagamento.id),
      pixCopiaECola: dadosPix?.qr_code,
      qrCodeBase64: dadosPix?.qr_code_base64
        ? `data:image/png;base64,${dadosPix.qr_code_base64}`
        : undefined,
    };
  }

  async consultarStatus(transacaoId: string): Promise<StatusCobranca> {
    const pagamento = await this.request<PagamentoMercadoPago>(`/v1/payments/${transacaoId}`);
    return STATUS_MAP[pagamento.status] ?? "pendente";
  }

  async reembolsar(transacaoId: string): Promise<void> {
    await this.request(`/v1/payments/${transacaoId}/refunds`, { method: "POST" });
  }

  async testarConexao(): Promise<{ ok: boolean; mensagem: string }> {
    try {
      await this.request("/users/me");
      return { ok: true, mensagem: "Conexão com o Mercado Pago estabelecida com sucesso." };
    } catch (error) {
      return { ok: false, mensagem: error instanceof Error ? error.message : "Falha na conexão." };
    }
  }
}
