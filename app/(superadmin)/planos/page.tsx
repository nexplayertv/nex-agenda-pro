import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { PlanoForm } from "@/components/superadmin/plano-form";
import { CiclosCobranca } from "@/components/superadmin/ciclos-cobranca";

export default async function PlanosSuperadminPage() {
  const supabase = await createClient();
  const [{ data: plano }, { data: ciclos }] = await Promise.all([
    supabase.from("planos_saas").select("nome, trial_dias").eq("ativo", true).single(),
    supabase
      .from("ciclos_cobranca_saas")
      .select("id, nome, periodo_dias, valor, ativo")
      .order("periodo_dias", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos do SaaS"
        description="Nome do plano, teste grátis e os ciclos de cobrança oferecidos às empresas."
      />
      {plano ? (
        <PlanoForm nome={plano.nome} trialDias={plano.trial_dias} />
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum plano ativo encontrado.</p>
      )}

      <CiclosCobranca
        ciclos={(ciclos ?? []).map((c) => ({ ...c, valor: Number(c.valor) }))}
      />
    </div>
  );
}
