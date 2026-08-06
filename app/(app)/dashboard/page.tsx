import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  Landmark,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

async function carregarIndicadores(empresaId: string) {
  const supabase = await createClient();
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const hojeStr = hoje.toISOString().slice(0, 10);

  const [
    { count: agendamentosHoje },
    { count: clientesAtivos },
    { data: receitasMes },
    { count: aguardandoPagamento },
  ] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("data", hojeStr)
      .not("status", "in", "(cancelado,reembolsado)"),
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "ativo"),
    supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", inicioMes),
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("status", ["aguardando_pagamento", "aguardando_comprovante", "comprovante_enviado", "pagamento_em_analise"]),
  ]);

  const faturamentoMes = (receitasMes ?? []).reduce((soma, r) => soma + Number(r.valor), 0);

  return {
    agendamentosHoje: agendamentosHoje ?? 0,
    clientesAtivos: clientesAtivos ?? 0,
    faturamentoMes,
    aguardandoPagamento: aguardandoPagamento ?? 0,
  };
}

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  const indicadores = ctx?.empresaId
    ? await carregarIndicadores(ctx.empresaId)
    : { agendamentosHoje: 0, clientesAtivos: 0, faturamentoMes: 0, aguardandoPagamento: 0 };

  const cards = [
    {
      titulo: "Agendamentos hoje",
      valor: indicadores.agendamentosHoje,
      icon: CalendarDays,
    },
    {
      titulo: "Aguardando pagamento",
      valor: indicadores.aguardandoPagamento,
      icon: Wallet,
    },
    {
      titulo: "Faturamento do mês",
      valor: formatarMoeda(indicadores.faturamentoMes),
      icon: Landmark,
    },
    {
      titulo: "Clientes ativos",
      valor: indicadores.clientesAtivos,
      icon: Users,
    },
  ];

  const acoesRapidas = [
    { href: "/agendamentos/novo", label: "Novo agendamento", icon: CalendarPlus },
    { href: "/clientes", label: "Novo cliente", icon: UserPlus },
    { href: "/servicos", label: "Novo serviço", icon: Sparkles },
    { href: "/agenda", label: "Ver agenda", icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${ctx?.nome?.split(" ")[0] ?? ""}`}
        description="Aqui está um resumo do seu negócio."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.titulo}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {acoesRapidas.map((acao) => (
            <Button
              key={acao.href}
              variant="outline"
              render={
                <Link href={acao.href}>
                  <acao.icon />
                  {acao.label}
                </Link>
              }
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
