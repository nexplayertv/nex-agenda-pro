"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function paraISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function primeiroDiaMes(offsetMeses = 0): Date {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + offsetMeses, 1);
}

function ultimoDiaMes(offsetMeses = 0): Date {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + offsetMeses + 1, 0);
}

export function RelatoriosToolbar({ inicio, fim }: { inicio: string; fim: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function definirPeriodo(novoInicio: Date, novoFim: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("inicio", paraISO(novoInicio));
    params.set("fim", paraISO(novoFim));
    router.push(`${pathname}?${params.toString()}`);
  }

  const hoje = new Date();

  const presets = [
    { label: "Hoje", inicio: hoje, fim: hoje },
    {
      label: "Últimos 7 dias",
      inicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6),
      fim: hoje,
    },
    { label: "Este mês", inicio: primeiroDiaMes(), fim: hoje },
    { label: "Mês passado", inicio: primeiroDiaMes(-1), fim: ultimoDiaMes(-1) },
    { label: "Este ano", inicio: new Date(hoje.getFullYear(), 0, 1), fim: hoje },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() => definirPeriodo(p.inicio, p.fim)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="dataInicio" className="text-xs text-muted-foreground">
            De
          </Label>
          <Input
            id="dataInicio"
            type="date"
            value={inicio}
            max={fim}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("inicio", e.target.value);
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dataFim" className="text-xs text-muted-foreground">
            Até
          </Label>
          <Input
            id="dataFim"
            type="date"
            value={fim}
            min={inicio}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("fim", e.target.value);
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="w-40"
          />
        </div>
      </div>
    </div>
  );
}
