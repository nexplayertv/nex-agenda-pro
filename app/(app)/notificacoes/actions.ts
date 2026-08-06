"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";

export async function marcarNotificacaoLida(id: string): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  const supabase = await createClient();
  await supabase
    .from("notificacoes")
    .update({ lida: true })
    .eq("id", id)
    .eq("empresa_id", ctx.empresaId);

  revalidatePath("/notificacoes");
  revalidatePath("/dashboard");
}

export async function marcarTodasLidas(): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  const supabase = await createClient();
  await supabase
    .from("notificacoes")
    .update({ lida: true })
    .eq("empresa_id", ctx.empresaId)
    .eq("lida", false)
    .or(`usuario_id.is.null,usuario_id.eq.${ctx.userId}`);

  revalidatePath("/notificacoes");
  revalidatePath("/dashboard");
}
