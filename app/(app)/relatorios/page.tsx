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
import { formatarMoeda } from "@/lib/utils-domain/masks";
import { FaturamentoChart } from "@/components/financeiro/faturamento-chart";
import { RelatoriosToolbar } from "@/components/relatorios/relatorios-toolbar";
import { ExportarCsvButton, type LinhaExportacao } from "@/components/relatorios/exportar-csv-button";

function paraISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function addDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

function diasEntre(inicio: string, fim: string): number {
  const a = new Date(`${inicio}T00:00:00`);
  const b = new Date(`${fim}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const hoje = new Date();
  const inicio = params.inicio ?? paraISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const fim = params.fim ?? paraISO(hoje);

  const duracaoDias = Math.max(diasEntre(inicio, fim), 1);
  const inicioAnterior = addDias(inicio, -duracaoDias);
  const fimAnterior = addDias(inicio, -1);

  const supabase = await createClient();

  const [
    { data: receitas },
    { data: despesas },
    { data: receitasAnterior },
    { data: agendamentosFinalizados },
    { count: totalAgendamentos },
    { count: totalNaoCompareceu },
  ] = await Promise.all([
    supabase
      .from("receitas")
      .select("valor, data, descricao, categoria, forma_pagamento")
      .eq("empresa_id", ctx.empresaId)
      .gte("data", inicio)
      .lte("data", fim),
    supabase
      .from("despesas")
      .select("valor, data, descricao, categoria")
      .eq("empresa_id", ctx.empresaId)
      .gte("data", inicio)
      .lte("data", fim),
    supabase
      .from("receitas")
      .select("valor")
      .eq("empresa_id", ctx.empresaId)
      .gte("data", inicioAnterior)
      .lte("data", fimAnterior),
    supabase
      .from("agendamentos")
      .select("data, valor_total, servicos(nome), profissionais(nome, comissao_percentual)")
      .eq("empresa_id", ctx.empresaId)
      .eq("status", "finalizado")
      .gte("data", inicio)
      .lte("data", fim),
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", ctx.empresaId)
      .gte("data", inicio)
      .lte("data", fim)
      .not("status", "in", "(reserva_temporaria,aguardando_pagamento,aguardando_comprovante)"),
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", ctx.empresaId)
      .eq("status", "nao_compareceu")
      .gte("data", inicio)
      .lte("data", fim),
  ]);

  const faturamento = (receitas ?? []).reduce((s, r) => s + Number(r.valor), 0);
  const despesasTotal = (despesas ?? []).reduce((s, d) => s + Number(d.valor), 0);
  const faturamentoAnterior = (receitasAnterior ?? []).reduce((s, r) => s + Number(r.valor), 0);
  const variacaoFaturamento =
    faturamentoAnterior > 0 ? ((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100 : null;

  const finalizados = agendamentosFinalizados ?? [];
  const ticketMedio = finalizados.length > 0 ? faturamento / finalizados.length : 0;
  const taxaNaoComparecimento =
    totalAgendamentos && totalAgendamentos > 0
      ? ((totalNaoCompareceu ?? 0) / totalAgendamentos) * 100
      : 0;

  // Agrupa o grafico por dia se o periodo for curto, senao por mes.
  const agruparPorMes = duracaoDias > 62;
  const porGrupo = new Map<string, number>();
  for (const r of receitas ?? []) {
    const chave = agruparPorMes ? r.data.slice(0, 7) : r.data;
    porGrupo.set(chave, (porGrupo.get(chave) ?? 0) + Number(r.valor));
  }
  const dadosGrafico = Array.from(porGrupo.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, valor]) => ({
      mes: agruparPorMes ? `${MESES[Number(chave.slice(5, 7)) - 1]}/${chave.slice(2, 4)}` : chave.slice(8, 10),
      valor,
    }));

  type Agrupado = { nome: string; quantidade: number; receita: number; comissao: number };
  const porServico = new Map<string, Agrupado>();
  const porProfissional = new Map<string, Agrupado>();
  for (const a of finalizados) {
    const servico = (a.servicos as unknown as { nome: string } | null)?.nome ?? "—";
    const profissional = a.profissionais as unknown as {
      nome: string;
      comissao_percentual: number | null;
    } | null;
    const valor = Number(a.valor_total);

    const s = porServico.get(servico) ?? { nome: servico, quantidade: 0, receita: 0, comissao: 0 };
    s.quantidade += 1;
    s.receita += valor;
    porServico.set(servico, s);

    const nomeProf = profissional?.nome ?? "—";
    const p = porProfissional.get(nomeProf) ?? {
      nome: nomeProf,
      quantidade: 0,
      receita: 0,
      comissao: 0,
    };
    p.quantidade += 1;
    p.receita += valor;
    p.comissao += valor * ((profissional?.comissao_percentual ?? 0) / 100);
    porProfissional.set(nomeProf, p);
  }
  const topServicos = Array.from(porServico.values())
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 10);
  const desempenhoProfissionais = Array.from(porProfissional.values()).sort(
    (a, b) => b.receita - a.receita
  );

  const linhasExportacao: LinhaExportacao[] = [
    ...(receitas ?? []).map((r) => ({
      data: r.data,
      tipo: "Receita" as const,
      categoria: r.categoria ?? "",
      descricao: r.descricao ?? "",
      formaPagamento: r.forma_pagamento ?? "",
      valor: Number(r.valor),
    })),
    ...(despesas ?? []).map((d) => ({
      data: d.data,
      tipo: "Despesa" as const,
      categoria: d.categoria ?? "",
      descricao: d.descricao ?? "",
      formaPagamento: "",
      valor: Number(d.valor),
    })),
  ].sort((a, b) => a.data.localeCompare(b.data));

  const cards = [
    {
      titulo: "Faturamento do período",
      valor: formatarMoeda(faturamento),
      variacao: variacaoFaturamento,
    },
    { titulo: "Atendimentos finalizados", valor: String(finalizados.length) },
    { titulo: "Ticket médio", valor: formatarMoeda(ticketMedio) },
    { titulo: "Não comparecimento", valor: `${taxaNaoComparecimento.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Faturamento, desempenho por profissional e serviços mais vendidos, por período."
        actions={
          <Can recurso="relatorios" acao="exportar">
            <ExportarCsvButton
              linhas={linhasExportacao}
              nomeArquivo={`relatorio-financeiro-${inicio}-a-${fim}.csv`}
            />
          </Can>
        }
      />

      <RelatoriosToolbar inicio={inicio} fim={fim} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.titulo}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{c.valor}</div>
              {"variacao" in c && c.variacao !== null && c.variacao !== undefined && (
                <p
                  className={`text-xs ${c.variacao >= 0 ? "text-emerald-600" : "text-destructive"}`}
                >
                  {c.variacao >= 0 ? "+" : ""}
                  {c.variacao.toFixed(1)}% vs. período anterior
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento no período</CardTitle>
        </CardHeader>
        <CardContent>
          {dadosGrafico.length > 0 ? (
            <FaturamentoChart dados={dadosGrafico} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma receita registrada nesse período.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serviços mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topServicos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      Nenhum atendimento finalizado nesse período.
                    </TableCell>
                  </TableRow>
                )}
                {topServicos.map((s) => (
                  <TableRow key={s.nome}>
                    <TableCell>{s.nome}</TableCell>
                    <TableCell className="text-right">{s.quantidade}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(s.receita)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho por profissional</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead className="text-right">Atend.</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {desempenhoProfissionais.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum atendimento finalizado nesse período.
                    </TableCell>
                  </TableRow>
                )}
                {desempenhoProfissionais.map((p) => (
                  <TableRow key={p.nome}>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell className="text-right">{p.quantidade}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(p.receita)}</TableCell>
                    <TableCell className="text-right">{formatarMoeda(p.comissao)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Despesas do período</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(despesas ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Nenhuma despesa registrada nesse período.
                  </TableCell>
                </TableRow>
              )}
              {(despesas ?? []).map((d, i) => (
                <TableRow key={i}>
                  <TableCell>{d.descricao ?? "—"}</TableCell>
                  <TableCell>{d.categoria ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(Number(d.valor))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="pt-3 text-right text-sm font-medium">
            Total: {formatarMoeda(despesasTotal)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
