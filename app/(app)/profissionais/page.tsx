import { PageHeader } from "@/components/shared/page-header";
import { Can } from "@/hooks/use-permissions";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { ProfissionalFormDialog } from "@/components/profissionais/profissional-form-dialog";
import {
  ProfissionaisTable,
  type ProfissionalLinha,
} from "@/components/profissionais/profissionais-table";

export default async function ProfissionaisPage() {
  const ctx = await getAuthContext();
  let profissionais: ProfissionalLinha[] = [];

  if (ctx?.empresaId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profissionais")
      .select(
        "id, nome, telefone, email, especialidades, biografia, comissao_percentual, cor_agenda, status, horarios_funcionamento(dia_semana, hora_inicio, hora_fim)"
      )
      .eq("empresa_id", ctx.empresaId)
      .order("nome");
    profissionais = (data as unknown as ProfissionalLinha[] | null) ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profissionais"
        description="Especialidades, comissão e horários de atendimento de cada profissional."
        actions={
          <Can recurso="profissionais" acao="criar">
            <ProfissionalFormDialog />
          </Can>
        }
      />
      <ProfissionaisTable profissionais={profissionais} />
    </div>
  );
}
