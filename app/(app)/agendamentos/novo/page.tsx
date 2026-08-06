import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { NovoAgendamentoForm } from "@/components/agenda/novo-agendamento-form";

export default async function NovoAgendamentoPage() {
  const ctx = await getAuthContext();

  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const [{ data: clientes }, { data: servicos }, { data: profissionais }, { data: config }] =
    await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome, whatsapp")
        .eq("empresa_id", ctx.empresaId)
        .eq("status", "ativo")
        .order("nome"),
      supabase
        .from("servicos")
        .select("id, nome, valor, duracao_minutos")
        .eq("empresa_id", ctx.empresaId)
        .eq("status", "ativo")
        .order("nome"),
      supabase
        .from("profissionais")
        .select("id, nome")
        .eq("empresa_id", ctx.empresaId)
        .eq("status", "ativo")
        .order("nome"),
      supabase
        .from("configuracoes_empresas")
        .select("percentual_entrada")
        .eq("empresa_id", ctx.empresaId)
        .single(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo agendamento"
        description="Cliente, serviço, profissional, horário e pagamento em um só fluxo."
      />
      <NovoAgendamentoForm
        clientes={clientes ?? []}
        servicos={servicos ?? []}
        profissionais={profissionais ?? []}
        percentualEntrada={config?.percentual_entrada ?? 30}
      />
    </div>
  );
}
