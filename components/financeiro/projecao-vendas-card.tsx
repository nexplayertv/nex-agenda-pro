"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarMoeda } from "@/lib/utils-domain/masks";

export function ProjecaoVendasCard({
  metaPercentual,
  metaMensal,
  ano,
  mes,
  diasNoMes,
}: {
  metaPercentual: number | null;
  metaMensal: number;
  ano: number;
  mes: number; // 0-indexed
  diasNoMes: number;
}) {
  const primeiroDia = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const ultimoDia = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diasNoMes).padStart(2, "0")}`;

  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(ultimoDia);

  if (metaPercentual === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projeção de vendas</CardTitle>
          <CardDescription>
            Defina uma meta de crescimento em Configurações → Metas para ver a projeção aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dias = Math.max(
    0,
    Math.round(
      (new Date(`${fim}T00:00:00`).getTime() - new Date(`${inicio}T00:00:00`).getTime()) /
        86_400_000
    ) + 1
  );
  const valorEsperado = (metaMensal / diasNoMes) * dias;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Projeção de vendas</CardTitle>
        <CardDescription>
          Meta de {metaPercentual}% sobre o mês anterior — {formatarMoeda(metaMensal)} no mês
          inteiro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projecaoInicio">De</Label>
            <Input
              id="projecaoInicio"
              type="date"
              value={inicio}
              min={primeiroDia}
              max={ultimoDia}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projecaoFim">Até</Label>
            <Input
              id="projecaoFim"
              type="date"
              value={fim}
              min={primeiroDia}
              max={ultimoDia}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm text-muted-foreground">Pela meta, nesse período você deveria receber</p>
          <p className="text-xl font-bold">{formatarMoeda(valorEsperado)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
