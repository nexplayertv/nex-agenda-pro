import { z } from "zod";

export const profissionalSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  telefone: z.string().trim().optional().or(z.literal("")),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  especialidades: z.string().trim().optional().or(z.literal("")),
  biografia: z.string().trim().optional().or(z.literal("")),
  comissaoPercentual: z.coerce.number().min(0).max(100).optional(),
  corAgenda: z.string().trim().min(1),
});

export type ProfissionalInput = z.infer<typeof profissionalSchema>;

export const horarioSchema = z.object({
  diaSemana: z.coerce.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/),
});
