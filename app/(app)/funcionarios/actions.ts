"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  convidarFuncionarioSchema,
  editarFuncionarioSchema,
} from "@/lib/validations/funcionarios";

export type ActionState = { error: string | null };

export type LogAtividade = {
  id: string;
  acao: string;
  recurso: string;
  criado_em: string;
  dados_novos: unknown;
};

export async function buscarHistoricoAtividades(usuarioId: string): Promise<LogAtividade[]> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return [];

  await requirePermission(ctx.empresaId, "funcionarios", "visualizar");

  const supabase = await createClient();
  const { data } = await supabase
    .from("logs_atividades")
    .select("id, acao, recurso, criado_em, dados_novos")
    .eq("empresa_id", ctx.empresaId)
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function convidarFuncionario(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = convidarFuncionarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone") ?? "",
    cargoId: formData.get("cargoId"),
    profissionalId: formData.get("profissionalId") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "funcionarios", "criar");

  const { nome, email, telefone, cargoId, profissionalId } = parsed.data;
  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("funcionarios")
    .select("id")
    .eq("empresa_id", ctx.empresaId)
    .ilike("email", email)
    .maybeSingle();

  if (existente) {
    return { error: "Já existe um funcionário cadastrado com este e-mail." };
  }

  const { data: funcionario, error: erroFuncionario } = await supabase
    .from("funcionarios")
    .insert({
      empresa_id: ctx.empresaId,
      nome,
      email,
      telefone: telefone || null,
      cargo_id: cargoId,
      profissional_id: profissionalId || null,
      status: "convidado",
    })
    .select("id")
    .single();

  if (erroFuncionario) return { error: "Não foi possível cadastrar o funcionário." };

  const { data: convite, error: erroConvite } = await supabase
    .from("convites_funcionarios")
    .insert({
      empresa_id: ctx.empresaId,
      email,
      cargo_id: cargoId,
      profissional_id: profissionalId || null,
      criado_por: ctx.userId,
    })
    .select("token")
    .single();

  if (erroConvite || !convite) return { error: "Não foi possível gerar o convite." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const linkConvite = `${appUrl}/convite/${convite.token}`;

  try {
    const serviceClient = createServiceClient();
    await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: linkConvite,
      data: { nome },
    });
  } catch (err) {
    // Sem SMTP configurado no projeto Supabase o convite nao sai por
    // e-mail, mas o link continua valido e pode ser copiado manualmente
    // (ver docs/setup.md). Nao bloqueia o cadastro do funcionario.
    console.error("Falha ao enviar e-mail de convite", err);
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "convidar",
    recurso: "funcionarios",
    registroId: funcionario.id,
    dadosNovos: { nome, email, cargoId },
  });

  revalidatePath("/funcionarios");
  return { error: null };
}

export async function reenviarConvite(funcionarioId: string): Promise<{ error: string | null; link?: string }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "funcionarios", "editar");

  const supabase = await createClient();
  const { data: funcionario } = await supabase
    .from("funcionarios")
    .select("email, cargo_id, profissional_id")
    .eq("id", funcionarioId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  if (!funcionario) return { error: "Funcionário não encontrado." };

  const { data: convite, error } = await supabase
    .from("convites_funcionarios")
    .insert({
      empresa_id: ctx.empresaId,
      email: funcionario.email,
      cargo_id: funcionario.cargo_id,
      profissional_id: funcionario.profissional_id,
      criado_por: ctx.userId,
    })
    .select("token")
    .single();

  if (error || !convite) return { error: "Não foi possível gerar um novo convite." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const linkConvite = `${appUrl}/convite/${convite.token}`;

  try {
    const serviceClient = createServiceClient();
    await serviceClient.auth.admin.inviteUserByEmail(funcionario.email, {
      redirectTo: linkConvite,
    });
  } catch (err) {
    console.error("Falha ao reenviar e-mail de convite", err);
  }

  revalidatePath("/funcionarios");
  return { error: null, link: linkConvite };
}

export async function editarFuncionario(
  funcionarioId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = editarFuncionarioSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") ?? "",
    cargoId: formData.get("cargoId"),
    profissionalId: formData.get("profissionalId") ?? "",
    escopoDados: formData.get("escopoDados") ?? "total",
    observacoes: formData.get("observacoes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "funcionarios", "editar");

  const supabase = await createClient();
  const { data: funcionario } = await supabase
    .from("funcionarios")
    .select("usuario_empresa_id")
    .eq("id", funcionarioId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  const { error } = await supabase
    .from("funcionarios")
    .update({
      nome: parsed.data.nome,
      telefone: parsed.data.telefone || null,
      cargo_id: parsed.data.cargoId,
      profissional_id: parsed.data.profissionalId || null,
      observacoes: parsed.data.observacoes || null,
    })
    .eq("id", funcionarioId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  if (funcionario?.usuario_empresa_id) {
    await supabase
      .from("usuarios_empresas")
      .update({ cargo_id: parsed.data.cargoId, escopo_dados: parsed.data.escopoDados })
      .eq("id", funcionario.usuario_empresa_id);
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "funcionarios",
    registroId: funcionarioId,
    dadosNovos: parsed.data,
  });

  revalidatePath("/funcionarios");
  return { error: null };
}

async function definirStatusFuncionario(
  funcionarioId: string,
  status: "ativo" | "bloqueado" | "desligado"
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "funcionarios", "excluir");

  const supabase = await createClient();
  const { data: funcionario } = await supabase
    .from("funcionarios")
    .select("usuario_empresa_id")
    .eq("id", funcionarioId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  await supabase.from("funcionarios").update({ status }).eq("id", funcionarioId).eq(
    "empresa_id",
    ctx.empresaId
  );

  if (funcionario?.usuario_empresa_id) {
    // sessions_valid_since = now() derruba imediatamente qualquer sessao
    // aberta: minha_empresa_id()/tem_permissao() passam a retornar vazio
    // assim que o status deixa de ser 'ativo'.
    await supabase
      .from("usuarios_empresas")
      .update({ status, sessions_valid_since: new Date().toISOString() })
      .eq("id", funcionario.usuario_empresa_id);
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: status === "ativo" ? "reativar" : status,
    recurso: "funcionarios",
    registroId: funcionarioId,
  });

  revalidatePath("/funcionarios");
  return { error: null };
}

export async function bloquearFuncionario(funcionarioId: string) {
  return definirStatusFuncionario(funcionarioId, "bloqueado");
}

export async function reativarFuncionario(funcionarioId: string) {
  return definirStatusFuncionario(funcionarioId, "ativo");
}

export async function desligarFuncionario(
  funcionarioId: string,
  transferirParaProfissionalId?: string
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "funcionarios", "excluir");

  const supabase = await createClient();
  const { data: funcionario } = await supabase
    .from("funcionarios")
    .select("profissional_id")
    .eq("id", funcionarioId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  if (funcionario?.profissional_id) {
    if (transferirParaProfissionalId) {
      await supabase
        .from("agendamentos")
        .update({ profissional_id: transferirParaProfissionalId })
        .eq("empresa_id", ctx.empresaId)
        .eq("profissional_id", funcionario.profissional_id)
        .gte("data", new Date().toISOString().slice(0, 10))
        .not("status", "in", "(cancelado,finalizado,nao_compareceu,reembolsado)");
    }
    await supabase
      .from("profissionais")
      .update({ status: "inativo" })
      .eq("id", funcionario.profissional_id);
  }

  return definirStatusFuncionario(funcionarioId, "desligado");
}

export async function contarAgendamentosFuturos(profissionalId: string): Promise<number> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", ctx.empresaId)
    .eq("profissional_id", profissionalId)
    .gte("data", new Date().toISOString().slice(0, 10))
    .not("status", "in", "(cancelado,finalizado,nao_compareceu,reembolsado)");

  return count ?? 0;
}

export async function redefinirSenhaFuncionario(email: string): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "funcionarios", "editar");

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/redefinir-senha`,
  });

  return { error: null };
}
