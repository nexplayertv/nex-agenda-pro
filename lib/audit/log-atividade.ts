import "server-only";

import { createClient } from "@/lib/supabase/server";

type RegistrarAtividadeInput = {
  empresaId: string;
  usuarioId: string;
  cargoNome?: string | null;
  acao: string;
  recurso: string;
  registroId?: string | null;
  dadosAnteriores?: unknown;
  dadosNovos?: unknown;
};

/**
 * Grava uma linha em logs_atividades. Chamada ao final de toda Server
 * Action que cria/edita/exclui/confirma algo relevante (ver secao 28 do
 * escopo: agendamentos, pagamentos, comprovantes, funcionarios, etc.).
 * Falha silenciosamente (so loga no console) para nunca quebrar a acao
 * principal por causa de um problema no log de auditoria.
 */
export async function registrarAtividade(input: RegistrarAtividadeInput): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("logs_atividades").insert({
      empresa_id: input.empresaId,
      usuario_id: input.usuarioId,
      cargo_nome: input.cargoNome ?? null,
      acao: input.acao,
      recurso: input.recurso,
      registro_id: input.registroId ?? null,
      dados_anteriores: input.dadosAnteriores ?? null,
      dados_novos: input.dadosNovos ?? null,
    });
  } catch (error) {
    console.error("Falha ao registrar log de atividade", error);
  }
}
