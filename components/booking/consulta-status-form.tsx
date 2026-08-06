"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUS_AGENDAMENTO_META } from "@/lib/agenda/status";
import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";
import {
  buscarAgendamentosClienteAction,
  type AgendamentoClienteResumo,
} from "@/app/(public)/agendar/[empresaSlug]/actions";

export function ConsultaStatusForm({ empresaSlug }: { empresaSlug: string }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [agendamentos, setAgendamentos] = useState<AgendamentoClienteResumo[] | null>(null);

  function consultar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await buscarAgendamentosClienteAction(empresaSlug, nome, telefone);
      if (resultado.error) {
        setErro(resultado.error);
        setAgendamentos(null);
      } else {
        setAgendamentos(resultado.agendamentos);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="nome-consulta">Nome completo</Label>
            <Input
              id="nome-consulta"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como você informou no agendamento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone-consulta">WhatsApp</Label>
            <Input
              id="telefone-consulta"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 90000-0000"
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button className="w-full" disabled={pending || !nome || !telefone} onClick={consultar}>
            <Search />
            {pending ? "Consultando..." : "Consultar"}
          </Button>
        </CardContent>
      </Card>

      {agendamentos && agendamentos.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum agendamento encontrado para esse nome e telefone.
        </p>
      )}

      {agendamentos && agendamentos.length > 0 && (
        <div className="space-y-3">
          {agendamentos.map((a) => {
            const statusMeta = STATUS_AGENDAMENTO_META[a.status];
            return (
              <Card key={a.id}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{a.servicoNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatarData(a.data)} · {a.horaInicio.slice(0, 5)} · {a.profissionalNome}
                      </p>
                    </div>
                    {statusMeta && (
                      <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total {formatarMoeda(a.valorTotal)} · Entrada {formatarMoeda(a.valorEntrada)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
