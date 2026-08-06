"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { salvarHorarios } from "@/app/(app)/profissionais/actions";

const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export type HorarioExistente = { dia_semana: number; hora_inicio: string; hora_fim: string };

export function HorariosEditor({
  profissionalId,
  horarios,
}: {
  profissionalId: string;
  horarios: HorarioExistente[];
}) {
  const [linhas, setLinhas] = useState(() =>
    DIAS.map((_, dia) => {
      const existente = horarios.find((h) => h.dia_semana === dia);
      return {
        ativo: !!existente,
        horaInicio: existente?.hora_inicio?.slice(0, 5) ?? "09:00",
        horaFim: existente?.hora_fim?.slice(0, 5) ?? "18:00",
      };
    })
  );
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  function salvar() {
    setMensagem(null);
    startTransition(async () => {
      const payload = linhas
        .map((linha, dia) => ({ diaSemana: dia, ...linha }))
        .filter((l) => l.ativo)
        .map((l) => ({ diaSemana: l.diaSemana, horaInicio: l.horaInicio, horaFim: l.horaFim }));

      const resultado = await salvarHorarios(profissionalId, payload);
      setMensagem(resultado.error ?? "Horários salvos.");
    });
  }

  return (
    <div className="space-y-3">
      {DIAS.map((dia, i) => (
        <div key={dia} className="flex items-center gap-3">
          <label className="flex w-40 items-center gap-2 text-sm">
            <Checkbox
              checked={linhas[i].ativo}
              onCheckedChange={(checked) =>
                setLinhas((prev) =>
                  prev.map((l, idx) => (idx === i ? { ...l, ativo: !!checked } : l))
                )
              }
            />
            {dia}
          </label>
          <Input
            type="time"
            className="w-28"
            disabled={!linhas[i].ativo}
            value={linhas[i].horaInicio}
            onChange={(e) =>
              setLinhas((prev) =>
                prev.map((l, idx) => (idx === i ? { ...l, horaInicio: e.target.value } : l))
              )
            }
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="time"
            className="w-28"
            disabled={!linhas[i].ativo}
            value={linhas[i].horaFim}
            onChange={(e) =>
              setLinhas((prev) =>
                prev.map((l, idx) => (idx === i ? { ...l, horaFim: e.target.value } : l))
              )
            }
          />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button type="button" onClick={salvar} disabled={pending}>
          {pending ? "Salvando..." : "Salvar horários"}
        </Button>
        {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}
      </div>
    </div>
  );
}
