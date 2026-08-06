"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatarData } from "@/lib/utils-domain/masks";

type View = "dia" | "semana" | "mes" | "lista";

function addDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function AgendaToolbar({
  view,
  data,
  profissionais,
  profissionalId,
}: {
  view: View;
  data: string;
  profissionais: { id: string; nome: string }[];
  profissionalId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        <span className="pl-2 text-sm font-medium capitalize">{formatarData(data)}</span>
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
    </div>
  );
}
