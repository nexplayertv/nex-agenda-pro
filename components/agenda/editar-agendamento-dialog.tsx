"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buscarSlotsAction, editarAgendamento } from "@/app/(app)/agendamentos/actions";
import type { AgendamentoAgenda } from "./types";

export function EditarAgendamentoDialog({
  agendamento,
  profissionais,
  open,
  onOpenChange,
  onSalvo,
}: {
  agendamento: AgendamentoAgenda;
  profissionais: { id: string; nome: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvo: () => void;
}) {
  const [profissionalId, setProfissionalId] = useState(agendamento.profissionais?.id ?? "");
  const [data, setData] = useState(agendamento.data);
  const [horaInicio, setHoraInicio] = useState(agendamento.hora_inicio.slice(0, 5));
  const [observacoes, setObservacoes] = useState(agendamento.observacoes ?? "");
  const [slots, setSlots] = useState<string[]>([]);
  const [carregandoSlots, startTransitionSlots] = useTransition();
  const [salvando, startTransitionSalvar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [, startTransitionReset] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransitionReset(() => {
      setProfissionalId(agendamento.profissionais?.id ?? "");
      setData(agendamento.data);
      setHoraInicio(agendamento.hora_inicio.slice(0, 5));
      setObservacoes(agendamento.observacoes ?? "");
      setErro(null);
    });
  }, [open, agendamento]);

  useEffect(() => {
    if (!open || !profissionalId || !data || !agendamento.servicos?.id) return;
    startTransitionSlots(async () => {
      const s = await buscarSlotsAction(profissionalId, agendamento.servicos!.id, data);
      const atual = agendamento.hora_inicio.slice(0, 5);
      setSlots(profissionalId === agendamento.profissionais?.id && data === agendamento.data && !s.includes(atual) ? [atual, ...s] : s);
    });
  }, [open, profissionalId, data, agendamento]);

  function salvar() {
    setErro(null);
    startTransitionSalvar(async () => {
      const resultado = await editarAgendamento(agendamento.id, {
        profissionalId,
        data,
        horaInicio,
        observacoes,
      });
      if (resultado.error) {
        setErro(resultado.error);
      } else {
        onSalvo();
        onOpenChange(false);
      }
    });
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar agendamento</DialogTitle>
          <DialogDescription>
            {agendamento.servicos?.nome} · troque profissional, data ou horário para transferir
            este agendamento para um horário disponível.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select
              items={Object.fromEntries(profissionais.map((p) => [p.id, p.nome]))}
              value={profissionalId}
              onValueChange={(v) => setProfissionalId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {profissionais.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            {carregandoSlots && <p className="text-sm text-muted-foreground">Carregando...</p>}
            <div className="flex flex-wrap gap-2">
              {!carregandoSlots &&
                slots.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={horaInicio === s ? "default" : "outline"}
                    onClick={() => setHoraInicio(s)}
                  >
                    {s}
                  </Button>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button onClick={salvar} disabled={salvando || !horaInicio}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
