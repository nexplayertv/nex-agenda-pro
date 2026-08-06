"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null; sucesso?: boolean };

export async function editarTemplate(
  templateId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return { error: "Sessão inválida." };

  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { error: "O conteúdo não pode ficar vazio." };

  await requirePermission(ctx.empresaId, "mensagens", "editar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("templates_mensagens")
    .update({ conteudo })
    .eq("id", templateId)
    .eq("empresa_id", ctx.empresaId);

  if (error) return { error: "Não foi possível salvar o template." };

  revalidatePath("/mensagens");
  return { error: null, sucesso: true };
}

export async function registrarMensagemEnviada(params: {
  clienteId: string;
  agendamentoId: string;
  templateId: string;
  conteudoFinal: string;
}): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "mensagens", "criar");

  const supabase = await createClient();
  await supabase.from("historico_mensagens").insert({
    empresa_id: ctx.empresaId,
    cliente_id: params.clienteId,
    agendamento_id: params.agendamentoId,
    template_id: params.templateId,
    conteudo_final: params.conteudoFinal,
    canal: "whatsapp",
    enviado_por: ctx.userId,
  });

  revalidatePath("/agenda");
}
