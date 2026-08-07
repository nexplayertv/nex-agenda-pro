import "server-only";

import type {
  CriarCobrancaInput,
  CriarCobrancaResultado,
  PaymentGateway,
  StatusCobranca,
} from "./gateway";

const STATUS_MAP: Record<string, StatusCobranca> = {
  PENDING: "pendente",
  RECEIVED: "pago",
  CONFIRMED: "pago",
  RECEIVED_IN_CASH: "pago",
  OVERDUE: "pendente",
  REFUNDED: "reembolsado",
  REFUND_REQUESTED: "reembolsado",
  CHARGEBACK_REQUESTED: "reembolsado",
  AWAITING_RISK_ANALYSIS: "pendente",
};

export class AsaasGateway implements PaymentGateway {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = process.env.ASAAS_API_URL ?? "https://sandbox.asaas.com/api/v3"
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        access_token: this.apiKey,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const corpo = await response.text();
      throw new Error(`Asaas: ${response.status} - ${corpo}`);
    }

    return response.json() as Promise<T>;
  }

  private async buscarOuCriarCliente(input: CriarCobrancaInput): Promise<string> {
    const busca = await this.request<{ data: { id: string }[] }>(
      `/customers?email=${encodeURIComponent(input.clienteEmail ?? "")}&name=${encodeURIComponent(input.clienteNome)}`
    );
    if (busca.data.length > 0) return busca.data[0].id;

    // O Asaas exige CPF/CNPJ do cliente para emitir cobranca Pix - sem
    // isso a API responde 400 "invalid_object".
    const criado = await this.request<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: input.clienteNome,
        email: input.clienteEmail || undefined,
        mobilePhone: input.clienteWhatsapp || undefined,
        cpfCnpj: input.clienteCpfCnpj?.replace(/\D/g, "") || undefined,
      }),
    });
    return criado.id;
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResultado> {
    const customerId = await this.buscarOuCriarCliente(input);

    const cobranca = await this.request<{ id: string; invoiceUrl: string }>("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: input.valor,
        description: input.descricao,
        externalReference: input.referenciaExterna,
        dueDate: new Date().toISOString().slice(0, 10),
      }),
    });

    let pixCopiaECola: string | undefined;
    let qrCodeBase64: string | undefined;
    try {
      const pix = await this.request<{ payload: string; encodedImage: string }>(
        `/payments/${cobranca.id}/pixQrCode`
      );
      pixCopiaECola = pix.payload;
      qrCodeBase64 = pix.encodedImage;
    } catch {
      // QR Code Pix pode nao estar disponivel imediatamente; o cliente
      // ainda pode pagar pelo link (invoiceUrl).
    }

    return {
      transacaoId: cobranca.id,
      urlPagamento: cobranca.invoiceUrl,
      pixCopiaECola,
      qrCodeBase64,
    };
  }

  async consultarStatus(transacaoId: string): Promise<StatusCobranca> {
    const cobranca = await this.request<{ status: string }>(`/payments/${transacaoId}`);
    return STATUS_MAP[cobranca.status] ?? "pendente";
  }

  async reembolsar(transacaoId: string): Promise<void> {
    await this.request(`/payments/${transacaoId}/refund`, { method: "POST" });
  }

  async testarConexao(): Promise<{ ok: boolean; mensagem: string }> {
    try {
      await this.request("/finance/balance");
      return { ok: true, mensagem: "Conexão com o Asaas estabelecida com sucesso." };
    } catch (error) {
      return { ok: false, mensagem: error instanceof Error ? error.message : "Falha na conexão." };
    }
  }
}
