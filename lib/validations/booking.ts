import { z } from "zod";

export const iniciarReservaSchema = z.object({
  servicoId: z.uuid(),
  profissionalId: z.uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  nomeCliente: z.string().trim().min(2, "Informe seu nome completo."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido."),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  cpfCnpj: z.string().trim().optional().or(z.literal("")),
  observacoes: z.string().trim().optional().or(z.literal("")),
  aceiteTermos: z.boolean().refine((v) => v === true, {
    message: "É necessário aceitar os termos e a política de cancelamento.",
  }),
});

export type IniciarReservaInput = z.infer<typeof iniciarReservaSchema>;
