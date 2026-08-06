"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";
import { profissionalSchema } from "@/lib/validations/profissionais";

export type ActionState = { error: string | null };

function parseProfissional(formData: FormData) {
  return profissionalSchema.parse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") ?? "",
    email: formData.get("email") ?? "",
    especialidades: formData.get("especialidades") ?? "",
    biografia: formData.get("biografia") ?? "",
    comissaoPercentual: formData.get("comissaoPercentual") || 0,
    corAgenda: formData.get("corAgenda") || "#7C3AED",
  });
}

function especialidadesArray(texto: string): string[] {
  return texto
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function criarProfissional(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  let parsed;
  try {
    parsed = parseProfissional(formData);
  } catch {
    return { error: "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "profissionais", "criar");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profissionais")
    .insert({
      empresa_id: ctx.empresaId,
      nome: parsed.nome,
      telefone: parsed.telefone || null,
      email: parsed.email || null,
      especialidades: especialidadesArray(parsed.especialidades ?? ""),
      biografia: parsed.biografia || null,
      comissao_percentual: parsed.comissaoPercentual ?? 0,
      cor_agenda: parsed.corAgenda,
    })
    .select("id")
    .single();

  if (error) return { error: "Não foi possível cadastrar o profissional." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "criar",
    recurso: "profissionais",
    registroId: data.id,
    dadosNovos: parsed,
  });

  revalidatePath("/profissionais");
  return { error: null };
}

export async function editarProfissional(
  profissionalId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  let parsed;
  try {
    parsed = parseProfissional(formData);
  } catch {
    return { error: "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "profissionais", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profissionais")
    .update({
      nome: parsed.nome,
      telefone: parsed.telefone || null,
      email: parsed.email || null,
      especialidades: especialidadesArray(parsed.especialidades ?? ""),
      biografia: parsed.biografia || null,
      comissao_percentual: parsed.comissaoPercentual ?? 0,
      cor_agenda: parsed.corAgenda,
    })
    .eq("id", profissionalId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "profissionais",
    registroId: profissionalId,
    dadosNovos: parsed,
  });

  revalidatePath("/profissionais");
  return { error: null };
}

export async function alternarStatusProfissional(
  profissionalId: string,
  ativo: boolean
): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "profissionais", "excluir");

  const supabase = await createClient();
  await supabase
    .from("profissionais")
    .update({ status: ativo ? "ativo" : "inativo" })
    .eq("id", profissionalId)
    .eq("empresa_id", ctx.empresaId);

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: ativo ? "reativar" : "desativar",
    recurso: "profissionais",
    registroId: profissionalId,
  });

  revalidatePath("/profissionais");
}

export async function salvarHorarios(
  profissionalId: string,
  horarios: { diaSemana: number; horaInicio: string; horaFim: string }[]
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  await requirePermission(ctx.empresaId, "profissionais", "editar");

  const supabase = await createClient();

  await supabase
    .from("horarios_funcionamento")
    .delete()
    .eq("empresa_id", ctx.empresaId)
    .eq("profissional_id", profissionalId);

  if (horarios.length > 0) {
    const { error } = await supabase.from("horarios_funcionamento").insert(
      horarios.map((h) => ({
        empresa_id: ctx.empresaId,
        profissional_id: profissionalId,
        dia_semana: h.diaSemana,
        hora_inicio: h.horaInicio,
        hora_fim: h.horaFim,
      }))
    );
    if (error) return { error: "Não foi possível salvar os horários." };
  }

  revalidatePath("/profissionais");
  return { error: null };
}
