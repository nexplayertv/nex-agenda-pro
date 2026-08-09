"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/validations/clientes";

export type ActionState = { error: string | null };

function parseFormData(formData: FormData) {
  return clienteSchema.parse({
    nome: formData.get("nome"),
    whatsapp: formData.get("whatsapp") ?? "",
    email: formData.get("email") ?? "",
    dataNascimento: formData.get("dataNascimento") ?? "",
    endereco: formData.get("endereco") ?? "",
    observacoes: formData.get("observacoes") ?? "",
    preferencias: formData.get("preferencias") ?? "",
  });
}

export async function criarCliente(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = parseFormData(formData);
  await requirePermission(ctx.empresaId, "clientes", "criar");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      empresa_id: ctx.empresaId,
      nome: parsed.nome,
      whatsapp: parsed.whatsapp || null,
      email: parsed.email || null,
      data_nascimento: parsed.dataNascimento || null,
      endereco: parsed.endereco || null,
      observacoes: parsed.observacoes || null,
      preferencias: parsed.preferencias || null,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível cadastrar o cliente." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "criar",
    recurso: "clientes",
    registroId: data.id,
    dadosNovos: parsed,
  });

  revalidatePath("/clientes");
  return { error: null };
}

export async function editarCliente(
  clienteId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = parseFormData(formData);
  await requirePermission(ctx.empresaId, "clientes", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      nome: parsed.nome,
      whatsapp: parsed.whatsapp || null,
      email: parsed.email || null,
      data_nascimento: parsed.dataNascimento || null,
      endereco: parsed.endereco || null,
      observacoes: parsed.observacoes || null,
      preferencias: parsed.preferencias || null,
    })
    .eq("id", clienteId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "clientes",
    registroId: clienteId,
    dadosNovos: parsed,
  });

  revalidatePath("/clientes");
  return { error: null };
}

export async function excluirCliente(clienteId: string): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "clientes", "excluir");

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", clienteId)
    .eq("empresa_id", ctx.empresaId);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Este cliente tem agendamentos ou mensagens registradas e não pode ser excluído. Desative-o em vez disso.",
      };
    }
    return { error: "Não foi possível excluir o cliente." };
  }

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "excluir",
    recurso: "clientes",
    registroId: clienteId,
  });

  revalidatePath("/clientes");
  return { error: null };
}

export async function alternarStatusCliente(clienteId: string, ativo: boolean): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "clientes", "excluir");

  const supabase = await createClient();
  await supabase
    .from("clientes")
    .update({ status: ativo ? "ativo" : "inativo" })
    .eq("id", clienteId)
    .eq("empresa_id", ctx.empresaId);

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: ativo ? "reativar" : "desativar",
    recurso: "clientes",
    registroId: clienteId,
  });

  revalidatePath("/clientes");
}
