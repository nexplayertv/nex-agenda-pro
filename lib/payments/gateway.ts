import "server-only";

// Interface comum implementada por lib/payments/asaas.ts e
// lib/payments/stripe.ts. O Pix próprio não implementa esta interface
// porque não tem cobrança automática - ver lib/payments/pix-brcode.ts e
// o fluxo manual em app/(public)/agendar/[empresaSlug]/actions.ts.

export type CriarCobrancaInput = {
  valor: number;
  descricao: string;
  clienteNome: string;
  clienteEmail?: string | null;
  clienteWhatsapp?: string | null;
  referenciaExterna: string; // agendamento_id
};

export type CriarCobrancaResultado = {
  transacaoId: string;
  urlPagamento?: string;
  pixCopiaECola?: string;
  qrCodeBase64?: string;
};

export type StatusCobranca = "pendente" | "pago" | "recusado" | "cancelado" | "reembolsado";

export interface PaymentGateway {
  criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResultado>;
  consultarStatus(transacaoId: string): Promise<StatusCobranca>;
  reembolsar(transacaoId: string): Promise<void>;
  testarConexao(): Promise<{ ok: boolean; mensagem: string }>;
}
