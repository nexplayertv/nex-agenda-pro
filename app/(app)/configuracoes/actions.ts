"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";
import {
  configuracoesAparenciaSchema,
  configuracoesCatalogoSchema,
  configuracoesNegocioSchema,
  configuracoesPagamentoSchema,
} from "@/lib/validations/configuracoes";

export type ActionState = { error: string | null; sucesso?: boolean };

export async function salvarNegocio(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = configuracoesNegocioSchema.safeParse({
    nome: formData.get("nome"),
    segmento: formData.get("segmento"),
    descricao: formData.get("descricao") ?? "",
    telefone: formData.get("telefone") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    email: formData.get("email") ?? "",
    endereco: formData.get("endereco") ?? "",
    instagram: formData.get("instagram") ?? "",
    facebook: formData.get("facebook") ?? "",
    exibirLocalizacao: formData.get("exibirLocalizacao"),
    exibirWhatsappPublico: formData.get("exibirWhatsappPublico"),
    exibirInstagram: formData.get("exibirInstagram"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "configuracoes", "editar");

  const supabase = await createClient();
  const { nome, segmento, ...resto } = parsed.data;

  const { error: erroEmpresa } = await supabase
    .from("empresas")
    .update({ nome, segmento })
    .eq("id", ctx.empresaId);
  const { error: erroConfig } = await supabase
    .from("configuracoes_empresas")
    .update({
      descricao: resto.descricao || null,
      telefone: resto.telefone || null,
      whatsapp: resto.whatsapp || null,
      email: resto.email || null,
      endereco: resto.endereco || null,
      redes_sociais: { instagram: resto.instagram || null, facebook: resto.facebook || null },
      exibir_localizacao: resto.exibirLocalizacao,
      exibir_whatsapp_publico: resto.exibirWhatsappPublico,
      exibir_instagram: resto.exibirInstagram,
    })
    .eq("empresa_id", ctx.empresaId);

  if (erroEmpresa || erroConfig) return { error: "Não foi possível salvar as informações." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "configuracoes",
    dadosNovos: parsed.data,
  });

  revalidatePath("/configuracoes");
  return { error: null, sucesso: true };
}

export async function salvarAparencia(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = configuracoesAparenciaSchema.safeParse({
    logoUrl: formData.get("logoUrl") ?? "",
    imagemCapaUrl: formData.get("imagemCapaUrl") ?? "",
    corPrimaria: formData.get("corPrimaria"),
    corSecundaria: formData.get("corSecundaria"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "configuracoes", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes_empresas")
    .update({
      logo_url: parsed.data.logoUrl || null,
      imagem_capa_url: parsed.data.imagemCapaUrl || null,
      cor_primaria: parsed.data.corPrimaria,
      cor_secundaria: parsed.data.corSecundaria,
    })
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar a aparência." };

  revalidatePath("/configuracoes");
  return { error: null, sucesso: true };
}

export async function salvarPagamento(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = configuracoesPagamentoSchema.safeParse({
    percentualEntrada: formData.get("percentualEntrada"),
    prazoReservaMinutos: formData.get("prazoReservaMinutos"),
    prazoComprovanteMinutos: formData.get("prazoComprovanteMinutos"),
    prazoAnaliseComprovanteMinutos: formData.get("prazoAnaliseComprovanteMinutos"),
    politicaCancelamento: formData.get("politicaCancelamento") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "configuracoes", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes_empresas")
    .update({
      percentual_entrada: parsed.data.percentualEntrada,
      prazo_reserva_minutos: parsed.data.prazoReservaMinutos,
      prazo_comprovante_minutos: parsed.data.prazoComprovanteMinutos,
      prazo_analise_comprovante_minutos: parsed.data.prazoAnaliseComprovanteMinutos,
      politica_cancelamento: parsed.data.politicaCancelamento || null,
    })
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as configurações de pagamento." };

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "editar",
    recurso: "configuracoes",
    dadosNovos: { evento: "percentual_entrada_alterado", ...parsed.data },
  });

  revalidatePath("/configuracoes");
  return { error: null, sucesso: true };
}

export async function salvarCatalogo(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const parsed = configuracoesCatalogoSchema.safeParse({
    catalogoPublicoAtivo: formData.get("catalogoPublicoAtivo"),
    ocultarValoresCatalogo: formData.get("ocultarValoresCatalogo"),
    moeda: formData.get("moeda") || "BRL",
    fusoHorario: formData.get("fusoHorario") || "America/Sao_Paulo",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  await requirePermission(ctx.empresaId, "configuracoes", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes_empresas")
    .update({
      catalogo_publico_ativo: parsed.data.catalogoPublicoAtivo,
      ocultar_valores_catalogo: parsed.data.ocultarValoresCatalogo,
      moeda: parsed.data.moeda,
      fuso_horario: parsed.data.fusoHorario,
    })
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar as configurações do catálogo." };

  revalidatePath("/configuracoes");
  return { error: null, sucesso: true };
}
