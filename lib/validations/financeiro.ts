import { z } from "zod";

export const receitaSchema = z.object({
  descricao: z.string().trim().min(2, "Informe uma descrição."),
  categoria: z.string().trim().optional().or(z.literal("")),
  valor: z.coerce.number().positive("Informe um valor válido."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  formaPagamento: z.string().trim().optional().or(z.literal("")),
});

export const despesaSchema = z.object({
  descricao: z.string().trim().min(2, "Informe uma descrição."),
  categoria: z.string().trim().optional().or(z.literal("")),
  valor: z.coerce.number().positive("Informe um valor válido."),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
