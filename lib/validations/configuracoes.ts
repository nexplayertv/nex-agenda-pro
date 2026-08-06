import { z } from "zod";

export const configuracoesNegocioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do negócio."),
  segmento: z.string().trim().min(1),
  descricao: z.string().trim().optional().or(z.literal("")),
  telefone: z.string().trim().optional().or(z.literal("")),
  whatsapp: z.string().trim().optional().or(z.literal("")),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  endereco: z.string().trim().optional().or(z.literal("")),
  instagram: z.string().trim().optional().or(z.literal("")),
  facebook: z.string().trim().optional().or(z.literal("")),
});

export const configuracoesAparenciaSchema = z.object({
  logoUrl: z.url("URL inválida.").optional().or(z.literal("")),
  imagemCapaUrl: z.url("URL inválida.").optional().or(z.literal("")),
  corPrimaria: z.string().trim().min(1),
  corSecundaria: z.string().trim().min(1),
});

export const configuracoesPagamentoSchema = z.object({
  percentualEntrada: z.coerce.number().int().min(0).max(100),
  prazoReservaMinutos: z.coerce.number().int().positive(),
  prazoComprovanteMinutos: z.coerce.number().int().positive(),
  prazoAnaliseComprovanteMinutos: z.coerce.number().int().positive(),
  politicaCancelamento: z.string().trim().optional().or(z.literal("")),
});

export const configuracoesCatalogoSchema = z.object({
  catalogoPublicoAtivo: z.coerce.boolean(),
  ocultarValoresCatalogo: z.coerce.boolean(),
  moeda: z.string().trim().min(1),
  fusoHorario: z.string().trim().min(1),
});
