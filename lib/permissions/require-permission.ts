import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Acao, Recurso } from "@/lib/permissions/catalog";

export class PermissionError extends Error {
  constructor(recurso: string, acao: string) {
    super(`Sem permissão para "${acao}" em "${recurso}".`);
    this.name = "PermissionError";
  }
}

/**
 * Chama a MESMA funcao Postgres usada pelas policies de RLS
 * (tem_permissao, ver supabase/migrations/0010_helper_functions.sql).
 * E de proposito: garante que a checagem na Server Action nunca
 * diverge da checagem que o banco vai fazer de qualquer forma. Use no
 * inicio de toda Server Action que crie, edite, exclua ou confirme algo
 * - nunca confie apenas na UI (componente <Can>) para bloquear a acao.
 */
export async function requirePermission(
  empresaId: string,
  recurso: Recurso,
  acao: Acao
): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("tem_permissao", {
    p_empresa_id: empresaId,
    p_recurso: recurso,
    p_acao: acao,
  });

  if (error || !data) {
    throw new PermissionError(recurso, acao);
  }
}
