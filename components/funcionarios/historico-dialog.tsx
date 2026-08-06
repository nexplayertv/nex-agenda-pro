"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatarData } from "@/lib/utils-domain/masks";
import { buscarHistoricoAtividades, type LogAtividade } from "@/app/(app)/funcionarios/actions";

const ACAO_LABEL: Record<string, string> = {
  criar: "Criou",
  editar: "Editou",
  excluir: "Excluiu",
  confirmar: "Confirmou",
  cancelar: "Cancelou",
  aprovar: "Aprovou",
  reembolsar: "Reembolsou",
  convidar: "Convidou",
  bloqueado: "Bloqueou acesso",
  desligado: "Desligou",
  reativar: "Reativou acesso",
  liberar_sem_pagamento: "Liberou sem pagamento",
  confirmar_pagamento: "Confirmou pagamento",
  recusar_comprovante: "Recusou comprovante",
};

export function HistoricoDialog({
  usuarioId,
  trigger,
}: {
  usuarioId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogAtividade[]>([]);
  const [carregando, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          startTransition(async () => {
            setLogs(await buscarHistoricoAtividades(usuarioId));
          });
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de atividades</DialogTitle>
          <DialogDescription>Últimas ações realizadas por este funcionário.</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {carregando && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!carregando && logs.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border p-2.5 text-sm">
              <p>
                <span className="font-medium">{ACAO_LABEL[log.acao] ?? log.acao}</span> em{" "}
                <span className="text-muted-foreground">{log.recurso}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatarData(log.criado_em)}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
