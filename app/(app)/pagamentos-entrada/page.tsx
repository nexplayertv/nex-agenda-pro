import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { PagamentosTable, type PagamentoLinha } from "@/components/pagamentos/pagamentos-table";

const TIPOS_TEMPLATE = [
  "pagamento_aguardando",
  "pagamento_confirmado",
  "comprovante_recebido",
  "comprovante_recusado",
] as const;

export default async function PagamentosEntradaPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const [{ data }, { data: empresa }, { data: config }, { data: templatesData }] = await Promise.all([
    supabase
      .from("pagamentos")
      .select(
        "id, valor, status, forma_pagamento, created_at, agendamentos(id, data, hora_inicio, valor_total, valor_entrada, valor_restante, clientes(id, nome, whatsapp), profissionais(nome), servicos(nome)), comprovantes_pagamentos(arquivo_url, enviado_em)"
      )
      .eq("empresa_id", ctx.empresaId)
      .eq("tipo", "entrada")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("empresas").select("nome").eq("id", ctx.empresaId).single(),
    supabase
      .from("configuracoes_empresas")
      .select("whatsapp, endereco")
      .eq("empresa_id", ctx.empresaId)
      .single(),
    supabase
      .from("templates_mensagens")
      .select("id, tipo, conteudo")
      .eq("empresa_id", ctx.empresaId)
      .eq("ativo", true)
      .in("tipo", TIPOS_TEMPLATE),
  ]);

  const pagamentos = (data as unknown as PagamentoLinha[] | null) ?? [];
  const templates = Object.fromEntries(
    (templatesData ?? []).map((t) => [t.tipo, { id: t.id, conteudo: t.conteudo }])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos de entrada"
        description="Entradas recebidas, pendentes e comprovantes Pix aguardando confirmação."
      />
      <PagamentosTable
        pagamentos={pagamentos}
        templates={templates}
        empresaNome={empresa?.nome ?? ""}
        empresaWhatsapp={config?.whatsapp ?? null}
        empresaEndereco={config?.endereco ?? null}
      />
    </div>
  );
}
