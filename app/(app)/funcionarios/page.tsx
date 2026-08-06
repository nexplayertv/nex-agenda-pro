import { PageHeader } from "@/components/shared/page-header";
import { Can } from "@/hooks/use-permissions";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { ConvidarFuncionarioDialog } from "@/components/funcionarios/convidar-funcionario-dialog";
import {
  FuncionariosTable,
  type FuncionarioLinha,
} from "@/components/funcionarios/funcionarios-table";

export default async function FuncionariosPage() {
  const ctx = await getAuthContext();
  let funcionarios: FuncionarioLinha[] = [];
  let cargos: { id: string; nome: string }[] = [];
  let profissionais: { id: string; nome: string }[] = [];

  if (ctx?.empresaId) {
    const supabase = await createClient();
    const [{ data: funcionariosData }, { data: cargosData }, { data: profissionaisData }] =
      await Promise.all([
        supabase
          .from("funcionarios")
          .select(
            "id, nome, email, telefone, cargo_id, profissional_id, observacoes, status, ultimo_acesso_em, usuario_id, escopo_dados:usuario_empresa_id(escopo_dados), cargos(nome)"
          )
          .eq("empresa_id", ctx.empresaId)
          .order("nome"),
        supabase.from("cargos").select("id, nome").eq("empresa_id", ctx.empresaId).order("nome"),
        supabase
          .from("profissionais")
          .select("id, nome")
          .eq("empresa_id", ctx.empresaId)
          .order("nome"),
      ]);

    funcionarios = ((funcionariosData ?? []) as unknown as Array<
      Omit<FuncionarioLinha, "escopo_dados"> & {
        escopo_dados: { escopo_dados: "proprio" | "total" } | null;
      }
    >).map((f) => ({
      ...f,
      escopo_dados: f.escopo_dados?.escopo_dados ?? "total",
    }));
    cargos = cargosData ?? [];
    profissionais = profissionaisData ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        description="Convites, cargos, permissões e controle de acesso da equipe."
        actions={
          <Can recurso="funcionarios" acao="criar">
            <ConvidarFuncionarioDialog cargos={cargos} profissionais={profissionais} />
          </Can>
        }
      />
      <FuncionariosTable
        funcionarios={funcionarios}
        cargos={cargos}
        profissionais={profissionais}
      />
    </div>
  );
}
