"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_AGENDAMENTO_META } from "@/lib/agenda/status";
import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";
import { AgendamentoDetailSheet } from "./agendamento-detail-sheet";
import type { AgendamentoAgenda } from "./types";

function AgendamentoLinha({
  agendamento,
  onClick,
}: {
  agendamento: AgendamentoAgenda;
  onClick: () => void;
}) {
  const statusMeta = STATUS_AGENDAMENTO_META[agendamento.status];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
    >
      <span
        className="h-10 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: agendamento.profissionais?.cor_agenda ?? "#7C3AED" }}
      />
      <div className="w-16 shrink-0 text-sm font-medium">{agendamento.hora_inicio.slice(0, 5)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{agendamento.clientes?.nome ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {agendamento.servicos?.nome} · {agendamento.profissionais?.nome}
        </p>
      </div>
      <div className="hidden text-right text-sm sm:block">
        {formatarMoeda(agendamento.valor_total)}
      </div>
      {statusMeta && (
        <Badge className={`${statusMeta.className} shrink-0`}>{statusMeta.label}</Badge>
      )}
    </button>
  );
}

export function AgendaView({
  view,
  data,
  agendamentos,
}: {
  view: "dia" | "semana" | "mes" | "lista";
  data: string;
  agendamentos: AgendamentoAgenda[];
}) {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState<AgendamentoAgenda | null>(null);
  const [open, setOpen] = useState(false);

  function abrir(a: AgendamentoAgenda) {
    setSelecionado(a);
    setOpen(true);
  }

  if (view === "dia" || view === "lista") {
    return (
      <div className="space-y-2">
        {agendamentos.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum agendamento encontrado.
            </CardContent>
          </Card>
        )}
        {agendamentos.map((a) => (
          <AgendamentoLinha
            key={a.id}
            agendamento={a}
            onClick={() => abrir(a)}
          />
        ))}
        <AgendamentoDetailSheet agendamento={selecionado} open={open} onOpenChange={setOpen} />
      </div>
    );
  }

  if (view === "semana") {
    const inicioSemana = new Date(`${data}T00:00:00`);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicioSemana);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    return (
      <div className="grid gap-3 md:grid-cols-7">
        {dias.map((dia) => (
          <div key={dia} className="space-y-2">
            <p className="text-center text-xs font-medium text-muted-foreground capitalize">
              {formatarData(dia)}
            </p>
            <div className="space-y-1.5">
              {agendamentos
                .filter((a) => a.data === dia)
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => abrir(a)}
                    className="w-full rounded-md border p-2 text-left text-xs hover:bg-muted/50"
                    style={{ borderLeftColor: a.profissionais?.cor_agenda ?? "#7C3AED", borderLeftWidth: 3 }}
                  >
                    <p className="font-medium">{a.hora_inicio.slice(0, 5)}</p>
                    <p className="truncate text-muted-foreground">{a.clientes?.nome}</p>
                  </button>
                ))}
            </div>
          </div>
        ))}
        <AgendamentoDetailSheet agendamento={selecionado} open={open} onOpenChange={setOpen} />
      </div>
    );
  }

  // Mes: grade de calendario com contagem por dia; clicar navega para o dia.
  const ancora = new Date(`${data}T00:00:00`);
  const primeiroDiaMes = new Date(ancora.getFullYear(), ancora.getMonth(), 1);
  const inicioGrade = new Date(primeiroDiaMes);
  inicioGrade.setDate(inicioGrade.getDate() - primeiroDiaMes.getDay());
  const celulas = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicioGrade);
    d.setDate(d.getDate() + i);
    return d;
  });

  const contagemPorDia = agendamentos.reduce<Record<string, number>>((acc, a) => {
    acc[a.data] = (acc[a.data] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
        <div key={d} className="pb-1 text-center text-xs font-medium text-muted-foreground">
          {d}
        </div>
      ))}
      {celulas.map((celula) => {
        const iso = celula.toISOString().slice(0, 10);
        const foraDoMes = celula.getMonth() !== ancora.getMonth();
        const contagem = contagemPorDia[iso] ?? 0;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => router.push(`?view=dia&data=${iso}`)}
            className={`aspect-square rounded-md border p-1.5 text-left text-xs hover:bg-muted/50 ${
              foraDoMes ? "text-muted-foreground/40" : ""
            }`}
          >
            <span>{celula.getDate()}</span>
            {contagem > 0 && (
              <Badge className="ml-1" variant="secondary">
                {contagem}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
