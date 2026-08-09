import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe sua senha."),
});

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.email("Informe um e-mail válido."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  nomeEmpresa: z.string().trim().min(2, "Informe o nome do negócio."),
  segmento: z.string().trim().min(1, "Selecione o segmento."),
});

export const esqueciSenhaSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
