"use client";

import { useState, useTransition } from "react";
import { Check, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_PAGAMENTO_META } from "@/lib/agenda/status";
import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";
import {
  confirmarPagamentoPix,
  obterUrlComprovante,
  recusarComprovante,
} from "@/app/(app)/pagamentos-entrada/actions";

export type PagamentoLinha = {
  id: string;
  valor: number;
  status: string;
  forma_pagamento: string;
  created_at: string;
  agendamentos: { data: string; hora_inicio: string; clientes: { nome: string; whatsapp: string | null } | null } | null;
  comprovantes_pagamentos: { arquivo_url: string; enviado_em: string }[];
};

export function PagamentosTable({ pagamentos }: { pagamentos: PagamentoLinha[] }) {
  const [, startTransition] = useTransition();
  const [recusando, setRecusando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  async function verComprovante(caminho: string) {
    const url = await obterUrlComprovante(caminho);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Agendamento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Comprovante</TableHead>
            <TableHead className="w-56" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagamentos.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                Nenhum pagamento encontrado.
              </TableCell>
            </TableRow>
          )}
          {pagamentos.map((p) => {
            const comprovante = p.comprovantes_pagamentos?.[p.comprovantes_pagamentos.length - 1];
            const statusMeta = STATUS_PAGAMENTO_META[p.status];
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium">{p.agendamentos?.clientes?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.agendamentos?.clientes?.whatsapp}
                  </p>
                </TableCell>
                <TableCell className="text-sm">
                  {p.agendamentos && (
                    <>
                      {formatarData(p.agendamentos.data)} · {p.agendamentos.hora_inicio.slice(0, 5)}
                    </>
                  )}
                </TableCell>
                <TableCell>{formatarMoeda(p.valor)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "pago" ? "default" : "secondary"}>
                    {statusMeta?.label ?? p.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {comprovante ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verComprovante(comprovante.arquivo_url)}
                    >
                      <FileText />
                      Ver
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {p.status === "em_analise" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          startTransition(async () => {
                            await confirmarPagamentoPix(p.id);
                          })
                        }
                      >
                        <Check />
                        Confirmar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRecusando(p.id)}>
                        <X />
                        Recusar
                      </Button>
                    </div>
                  )}
                  {p.status === "pendente" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        startTransition(async () => {
                          await confirmarPagamentoPix(p.id);
                        })
                      }
                    >
                      <Check />
                      Marcar como pago
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!recusando} onOpenChange={(open) => !open && setRecusando(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Recusar comprovante</DialogTitle>
            <DialogDescription>
              O cliente poderá enviar um novo comprovante dentro do prazo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  if (recusando) await recusarComprovante(recusando, motivo);
                  setRecusando(null);
                  setMotivo("");
                })
              }
            >
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
