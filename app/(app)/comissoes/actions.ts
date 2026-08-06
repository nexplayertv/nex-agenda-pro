"use server";

import { revalidatePath } from "next/cache";
import { registrarAtividade } from "@/lib/audit/log-atividade";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { requirePermission } from "@/lib/permissions/require-permission";
import { createClient } from "@/lib/supabase/server";

export async function marcarComissaoPaga(comissaoId: string): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return;

  await requirePermission(ctx.empresaId, "comissoes", "aprovar");

  const supabase = await createClient();
  await supabase
    .from("comissoes")
    .update({ status: "pago", data_pagamento: new Date().toISOString().slice(0, 10) })
    .eq("id", comissaoId)
    .eq("empresa_id", ctx.empresaId);

  await registrarAtividade({
    empresaId: ctx.empresaId,
    usuarioId: ctx.userId,
    cargoNome: ctx.cargoNome,
    acao: "aprovar",
    recurso: "comissoes",
    registroId: comissaoId,
  });

  revalidatePath("/comissoes");
}
