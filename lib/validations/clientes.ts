import { z } from "zod";

export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido.").optional().or(z.literal("")),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  endereco: z.string().trim().optional().or(z.literal("")),
  observacoes: z.string().trim().optional().or(z.literal("")),
  preferencias: z.string().trim().optional().or(z.literal("")),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
