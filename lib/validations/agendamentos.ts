import { z } from "zod";

export const novoAgendamentoSchema = z.object({
  clienteId: z.uuid("Selecione um cliente."),
  servicoId: z.uuid("Selecione um serviço."),
  profissionalId: z.uuid("Selecione um profissional."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecione uma data."),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Selecione um horário."),
  observacoes: z.string().trim().optional().or(z.literal("")),
  formaPagamento: z.enum(["dinheiro", "cartao_presencial", "pix_proprio", "outro"]),
  marcarComoPago: z.coerce.boolean().default(false),
  liberarSemPagamento: z.coerce.boolean().default(false),
});

export const novoClienteRapidoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do cliente."),
  whatsapp: z.string().trim().optional().or(z.literal("")),
});
