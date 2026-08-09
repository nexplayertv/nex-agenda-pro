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
  let profissionais: { id: string; nome: string }[] = [];

  if (ctx?.empresaId) {
    const supabase = await createClient();
    const [{ data: servicosData }, { data: categoriasData }, { data: profissionaisData }] =
      await Promise.all([
        supabase
          .from("servicos")
          .select(
            "id, categoria_id, nome, descricao, valor, duracao_minutos, intervalo_minutos, destaque, visivel_catalogo, observacoes, foto_url, status, categorias_servicos(nome), profissionais_servicos(profissional_id)"
          )
          .eq("empresa_id", ctx.empresaId)
          .order("ordem"),
        supabase
          .from("categorias_servicos")
          .select("id, nome")
          .eq("empresa_id", ctx.empresaId)
          .order("ordem"),
        supabase
          .from("profissionais")
          .select("id, nome")
          .eq("empresa_id", ctx.empresaId)
          .eq("status", "ativo")
          .order("nome"),
      ]);
    servicos = (servicosData as unknown as ServicoLinha[] | null) ?? [];
    categorias = categoriasData ?? [];
    profissionais = profissionaisData ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços oferecidos, valores e duração."
        actions={
          <Can recurso="servicos" acao="criar">
            <ServicoFormDialog categorias={categorias} profissionais={profissionais} />
          </Can>
        }
      />
      <ServicosTable servicos={servicos} categorias={categorias} profissionais={profissionais} />
    </div>
  );
}
