"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_AGENDAMENTO_META } from "@/lib/agenda/status";
import { formatarData } from "@/lib/utils-domain/masks";

type View = "dia" | "semana" | "mes" | "lista";

function addDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function paraDataISO(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function AgendaToolbar({
  view,
  data,
  profissionais,
  profissionalId,
  status,
}: {
  view: View;
  data: string;
  profissionais: { id: string; nome: string }[];
  profissionalId: string;
  status: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [calendarioAberto, setCalendarioAberto] = useState(false);

  function atualizar(mudancas: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(mudancas)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const passo = view === "semana" ? 7 : view === "mes" ? 30 : 1;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs value={view} onValueChange={(v) => v && atualizar({ view: v })}>
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => atualizar({ data: addDias(data, -passo) })}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => atualizar({ data: new Date().toISOString().slice(0, 10) })}
        >
          Hoje
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => atualizar({ data: addDias(data, passo) })}
        >
          <ChevronRight />
        </Button>

        <Popover open={calendarioAberto} onOpenChange={setCalendarioAberto}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5">
                <CalendarIcon />
                <span className="capitalize">{formatarData(data)}</span>
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(`${data}T00:00:00`)}
              onSelect={(dia) => {
                if (!dia) return;
                atualizar({ data: paraDataISO(dia) });
                setCalendarioAberto(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Select
        items={{
          todos: "Todos os profissionais",
          ...Object.fromEntries(profissionais.map((p) => [p.id, p.nome])),
        }}
        value={profissionalId || "todos"}
        onValueChange={(v) => atualizar({ profissionalId: v === "todos" ? "" : (v ?? "") })}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Todos os profissionais" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os profissionais</SelectItem>
          {profissionais.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{
          todos: "Todos os status",
          ...Object.fromEntries(
            Object.entries(STATUS_AGENDAMENTO_META).map(([valor, meta]) => [valor, meta.label])
          ),
        }}
        value={status || "todos"}
        onValueChange={(v) => atualizar({ status: v === "todos" ? "" : (v ?? "") })}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {Object.entries(STATUS_AGENDAMENTO_META).map(([valor, meta]) => (
            <SelectItem key={valor} value={valor}>
              {meta.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
