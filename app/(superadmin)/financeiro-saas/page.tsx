import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";
import { FaturamentoChart } from "@/components/financeiro/faturamento-chart";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

type PagamentoLinha = {
  id: string;
  valor: number;
  data_pagamento: string | null;
  gateway: string | null;
  empresas: { nome: string } | null;
};

export default async function FinanceiroSaasPage() {
  const supabase = await createClient();
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
  const seiseMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1).toISOString();

  const [{ data: pagamentosData }, { count: empresasAtivas }] = await Promise.all([
    supabase
      .from("pagamentos_saas")
      .select("id, valor, data_pagamento, gateway, empresas(nome)")
      .eq("status", "pago")
      .gte("data_pagamento", seiseMesesAtras)
      .order("data_pagamento", { ascending: false }),
    supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("status_assinatura", "ativa"),
  ]);

  const pagamentos = (pagamentosData as unknown as PagamentoLinha[] | null) ?? [];

  const pagamentosMes = pagamentos.filter((p) => (p.data_pagamento ?? "") >= inicioMes);
  const receitaMes = pagamentosMes.reduce((s, p) => s + Number(p.valor), 0);
  const receita6Meses = pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const ticketMedio = pagamentos.length ? receita6Meses / pagamentos.length : 0;

  const porMes = new Map<string, number>();
  for (const p of pagamentos) {
    if (!p.data_pagamento) continue;
    const d = new Date(p.data_pagamento);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    porMes.set(chave, (porMes.get(chave) ?? 0) + Number(p.valor));
  }
  const dadosGrafico = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    return { mes: MESES[d.getMonth()], valor: porMes.get(chave) ?? 0 };
  });

  const cards = [
    { titulo: "Receita do mês", valor: formatarMoeda(receitaMes) },
    { titulo: "Receita (últimos 6 meses)", valor: formatarMoeda(receita6Meses) },
    { titulo: "Empresas com assinatura ativa", valor: String(empresasAtivas ?? 0) },
    { titulo: "Ticket médio por pagamento", valor: formatarMoeda(ticketMedio) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro do SaaS"
        description="Receita da plataforma vinda das assinaturas das empresas."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.titulo}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-bold">{c.valor}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita dos últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <FaturamentoChart dados={dadosGrafico} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamentos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pagamentos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum pagamento confirmado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.slice(0, 30).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.empresas?.nome ?? "—"}</TableCell>
                      <TableCell className="capitalize">{p.gateway ?? "—"}</TableCell>
                      <TableCell>
                        {p.data_pagamento ? formatarData(p.data_pagamento) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{formatarMoeda(Number(p.valor))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
