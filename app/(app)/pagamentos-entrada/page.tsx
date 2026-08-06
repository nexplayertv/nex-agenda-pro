import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { PagamentosTable, type PagamentoLinha } from "@/components/pagamentos/pagamentos-table";

export default async function PagamentosEntradaPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pagamentos")
    .select(
      "id, valor, status, forma_pagamento, created_at, agendamentos(data, hora_inicio, clientes(nome, whatsapp)), comprovantes_pagamentos(arquivo_url, enviado_em)"
    )
    .eq("empresa_id", ctx.empresaId)
    .eq("tipo", "entrada")
    .order("created_at", { ascending: false })
    .limit(100);

  const pagamentos = (data as unknown as PagamentoLinha[] | null) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos de entrada"
        description="Entradas recebidas, pendentes e comprovantes Pix aguardando confirmação."
      />
      <PagamentosTable pagamentos={pagamentos} />
    </div>
  );
}
