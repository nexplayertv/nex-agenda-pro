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
import { Can } from "@/hooks/use-permissions";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";
import { FaturamentoChart } from "@/components/financeiro/faturamento-chart";
import { LancamentoDialog } from "@/components/financeiro/lancamento-dialog";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function FinanceiroPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const seiseMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10);

  const [
    { data: receitas },
    { data: despesasMes },
    { count: totalFinalizados },
    { data: pendentes },
  ] = await Promise.all([
    supabase
      .from("receitas")
      .select("valor, data, descricao, categoria, forma_pagamento")
      .eq("empresa_id", ctx.empresaId)
      .gte("data", seiseMesesAtras)
      .order("data", { ascending: false }),
    supabase
      .from("despesas")
      .select("valor, data, descricao, categoria")
      .eq("empresa_id", ctx.empresaId)
      .gte("data", inicioMes)
      .order("data", { ascending: false }),
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", ctx.empresaId)
      .eq("status", "finalizado")
      .gte("data", inicioMes),
    supabase
      .from("pagamentos")
      .select("valor")
      .eq("empresa_id", ctx.empresaId)
      .eq("status", "pendente"),
  ]);

  const receitasMes = (receitas ?? []).filter((r) => r.data >= inicioMes);
  const faturamentoMes = receitasMes.reduce((s, r) => s + Number(r.valor), 0);
  const despesasTotalMes = (despesasMes ?? []).reduce((s, d) => s + Number(d.valor), 0);
  const valoresPendentes = (pendentes ?? []).reduce((s, p) => s + Number(p.valor), 0);
  const ticketMedio = totalFinalizados ? faturamentoMes / totalFinalizados : 0;

  const porMes = new Map<string, number>();
  for (const r of receitas ?? []) {
    const d = new Date(`${r.data}T00:00:00`);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    porMes.set(chave, (porMes.get(chave) ?? 0) + Number(r.valor));
  }
  const dadosGrafico = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    return { mes: MESES[d.getMonth()], valor: porMes.get(chave) ?? 0 };
  });

  const cards = [
    { titulo: "Faturamento do mês", valor: formatarMoeda(faturamentoMes) },
    { titulo: "Despesas do mês", valor: formatarMoeda(despesasTotalMes) },
    { titulo: "Lucro estimado", valor: formatarMoeda(faturamentoMes - despesasTotalMes) },
    { titulo: "Ticket médio", valor: formatarMoeda(ticketMedio) },
    { titulo: "Valores pendentes", valor: formatarMoeda(valoresPendentes) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Receitas, despesas, fluxo de caixa e faturamento por período."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <CardTitle className="text-base">Faturamento dos últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <FaturamentoChart dados={dadosGrafico} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Receitas recentes</CardTitle>
            <Can recurso="receitas" acao="criar">
              <LancamentoDialog tipo="receita" />
            </Can>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(receitas ?? []).slice(0, 10).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.descricao ?? r.categoria ?? "Receita"}</TableCell>
                    <TableCell>{formatarData(r.data)}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(Number(r.valor))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Despesas do mês</CardTitle>
            <Can recurso="despesas" acao="criar">
              <LancamentoDialog tipo="despesa" />
            </Can>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(despesasMes ?? []).map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{d.descricao}</TableCell>
                    <TableCell>{formatarData(d.data)}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(Number(d.valor))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
