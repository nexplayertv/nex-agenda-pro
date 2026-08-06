import { PageHeader } from "@/components/shared/page-header";
import { Can } from "@/hooks/use-permissions";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { ServicoFormDialog } from "@/components/servicos/servico-form-dialog";
import { ServicosTable, type ServicoLinha } from "@/components/servicos/servicos-table";

export default async function ServicosPage() {
  const ctx = await getAuthContext();
  let servicos: ServicoLinha[] = [];
  let categorias: { id: string; nome: string }[] = [];

  if (ctx?.empresaId) {
    const supabase = await createClient();
    const [{ data: servicosData }, { data: categoriasData }] = await Promise.all([
      supabase
        .from("servicos")
        .select(
          "id, categoria_id, nome, descricao, valor, duracao_minutos, intervalo_minutos, destaque, visivel_catalogo, observacoes, status, categorias_servicos(nome)"
        )
        .eq("empresa_id", ctx.empresaId)
        .order("ordem"),
      supabase
        .from("categorias_servicos")
        .select("id, nome")
        .eq("empresa_id", ctx.empresaId)
        .order("ordem"),
    ]);
    servicos = (servicosData as unknown as ServicoLinha[] | null) ?? [];
    categorias = categoriasData ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços oferecidos, valores e duração."
        actions={
          <Can recurso="servicos" acao="criar">
            <ServicoFormDialog categorias={categorias} />
          </Can>
        }
      />
      <ServicosTable servicos={servicos} categorias={categorias} />
    </div>
  );
}
