import { z } from "zod";

export const convidarFuncionarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  email: z.email("E-mail inválido."),
  telefone: z.string().trim().optional().or(z.literal("")),
  cargoId: z.uuid("Selecione um cargo."),
  profissionalId: z.uuid().optional().or(z.literal("")),
});

export type ConvidarFuncionarioInput = z.infer<typeof convidarFuncionarioSchema>;

export const editarFuncionarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  telefone: z.string().trim().optional().or(z.literal("")),
  cargoId: z.uuid("Selecione um cargo."),
  profissionalId: z.uuid().optional().or(z.literal("")),
  escopoDados: z.enum(["proprio", "total"]),
  observacoes: z.string().trim().optional().or(z.literal("")),
});

export const definirSenhaSchema = z
  .object({
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });
