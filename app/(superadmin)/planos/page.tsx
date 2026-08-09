import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { PlanoForm } from "@/components/superadmin/plano-form";

export default async function PlanosSuperadminPage() {
  const supabase = await createClient();
  const { data: plano } = await supabase
    .from("planos_saas")
    .select("nome, valor_mensal, trial_dias")
    .eq("ativo", true)
    .single();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Planos do SaaS"
        description="Edite o plano de assinatura oferecido às empresas."
      />
      {plano ? (
        <PlanoForm
          nome={plano.nome}
          valorMensal={Number(plano.valor_mensal)}
          trialDias={plano.trial_dias}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum plano ativo encontrado.</p>
      )}
    </div>
  );
}
