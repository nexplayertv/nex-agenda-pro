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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  contarAgendamentosFuturos,
  desligarFuncionario,
} from "@/app/(app)/funcionarios/actions";

export function DesligarFuncionarioDialog({
  funcionarioId,
  profissionalId,
  outrosProfissionais,
  trigger,
}: {
  funcionarioId: string;
  profissionalId: string | null;
  outrosProfissionais: { id: string; nome: string }[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [futuros, setFuturos] = useState<number | null>(null);
  const [transferirPara, setTransferirPara] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open && profissionalId) {
      contarAgendamentosFuturos(profissionalId).then(setFuturos);
    }
  }, [open, profissionalId]);

  function confirmar() {
    startTransition(async () => {
      await desligarFuncionario(funcionarioId, transferirPara || undefined);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Desligar funcionário</DialogTitle>
          <DialogDescription>
            O acesso ao sistema é encerrado imediatamente. O histórico de agendamentos,
            comissões e atividades é mantido.
          </DialogDescription>
        </DialogHeader>

        {profissionalId && futuros !== null && futuros > 0 && (
          <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
            <p>
              Este profissional tem <strong>{futuros}</strong> agendamento(s) futuro(s). Escolha o
              que fazer com eles:
            </p>
            <Select value={transferirPara} onValueChange={(v) => setTransferirPara(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Manter como estão (não transferir)" />
              </SelectTrigger>
              <SelectContent>
                {outrosProfissionais.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Transferir para {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="destructive" onClick={confirmar} disabled={pending}>
            {pending ? "Desligando..." : "Confirmar desligamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
