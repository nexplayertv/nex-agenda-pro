import { z } from "zod";

export const servicoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do serviço."),
  categoriaId: z.uuid().optional().or(z.literal("")),
  descricao: z.string().trim().optional().or(z.literal("")),
  valor: z.coerce.number().positive("Informe um valor válido."),
  duracaoMinutos: z.coerce.number().int().positive("Informe uma duração válida."),
  intervaloMinutos: z.coerce.number().int().min(0).default(0),
  destaque: z.coerce.boolean().default(false),
  visivelCatalogo: z.coerce.boolean().default(true),
  observacoes: z.string().trim().optional().or(z.literal("")),
  fotoUrl: z.url("URL inválida.").optional().or(z.literal("")),
});

export type ServicoInput = z.infer<typeof servicoSchema>;

export const categoriaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da categoria."),
});
