"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";
import { categoriaSchema, servicoSchema } from "@/lib/validations/servicos";

export type ActionState = { error: string | null };

function parseServico(formData: FormData) {
  return servicoSchema.parse({
    nome: formData.get("nome"),
    categoriaId: formData.get("categoriaId") ?? "",
    descricao: formData.get("descricao") ?? "",
    valor: formData.get("valor"),
    duracaoMinutos: formData.get("duracaoMinutos"),
    intervaloMinutos: formData.get("intervaloMinutos") || 0,
    destaque: formData.get("destaque"),
    visivelCatalogo: formData.get("visivelCatalogo"),
    observacoes: formData.get("observacoes") ?? "",
  });
}

export async function criarServico(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  let parsed;
  try {
    parsed = parseServico(formData);
  } catch {
    return { error: "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "servicos", "criar");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .insert({
      empresa_id: ctx.empresaId,
      categoria_id: parsed.categoriaId || null,
      nome: parsed.nome,
      descricao: parsed.descricao || null,
      valor: parsed.valor,
      duracao_minutos: parsed.duracaoMinutos,
      intervalo_minutos: parsed.intervaloMinutos,
      destaque: parsed.destaque,
      visivel_catalogo: parsed.visivelCatalogo,
      observacoes: parsed.observacoes || null,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível cadastrar o serviço." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "criar",
    recurso: "servicos",
    registroId: data.id,
    dadosNovos: parsed,
  });

  revalidatePath("/servicos");
  return { error: null };
}

export async function editarServico(
  servicoId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  let parsed;
  try {
    parsed = parseServico(formData);
  } catch {
    return { error: "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "servicos", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("servicos")
    .update({
      categoria_id: parsed.categoriaId || null,
      nome: parsed.nome,
      descricao: parsed.descricao || null,
      valor: parsed.valor,
      duracao_minutos: parsed.duracaoMinutos,
      intervalo_minutos: parsed.intervaloMinutos,
      destaque: parsed.destaque,
      visivel_catalogo: parsed.visivelCatalogo,
      observacoes: parsed.observacoes || null,
    })
    .eq("id", servicoId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "servicos",
    registroId: servicoId,
    dadosNovos: parsed,
  });

  revalidatePath("/servicos");
  return { error: null };
}

export async function alternarStatusServico(servicoId: string, ativo: boolean): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "servicos", "excluir");

  const supabase = await createClient();
  await supabase
    .from("servicos")
    .update({ status: ativo ? "ativo" : "inativo" })
    .eq("id", servicoId)
    .eq("empresa_id", ctx.empresaId);

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: ativo ? "reativar" : "desativar",
    recurso: "servicos",
    registroId: servicoId,
  });

  revalidatePath("/servicos");
}

export async function criarCategoria(nome: string): Promise<{ id: string } | { error: string }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = categoriaSchema.safeParse({ nome });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  await requirePermission(ctx.empresaId, "servicos", "criar");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_servicos")
    .insert({ empresa_id: ctx.empresaId, nome: parsed.data.nome })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar a categoria." };

  revalidatePath("/servicos");
  return { id: data.id };
}

export async function salvarProfissionaisServico(
  servicoId: string,
  profissionalIds: string[]
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "servicos", "editar");

  const supabase = await createClient();

  // Confirma que o servico e realmente da empresa antes de mexer no vinculo.
  const { data: servico } = await supabase
    .from("servicos")
    .select("id")
    .eq("id", servicoId)
    .eq("empresa_id", ctx.empresaId)
    .single();

  if (!servico) return { error: "Serviço não encontrado." };

  await supabase.from("profissionais_servicos").delete().eq("servico_id", servicoId);

  if (profissionalIds.length > 0) {
    const { error } = await supabase.from("profissionais_servicos").insert(
      profissionalIds.map((profissionalId) => ({
        servico_id: servicoId,
        profissional_id: profissionalId,
      }))
    );
    if (error) return { error: "Não foi possível salvar os profissionais habilitados." };
  }

  revalidatePath("/servicos");
  return { error: null };
}
