"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { EnviarMensagemButton } from "@/components/mensagens/enviar-mensagem-button";
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
  agendamentos: {
    id: string;
    data: string;
    hora_inicio: string;
    valor_total: number;
    valor_entrada: number;
    valor_restante: number;
    clientes: { id: string; nome: string; whatsapp: string | null } | null;
    profissionais: { nome: string } | null;
    servicos: { nome: string } | null;
  } | null;
  comprovantes_pagamentos: { arquivo_url: string; enviado_em: string }[];
};

type TemplateInfo = { id: string; conteudo: string };

export function PagamentosTable({
  pagamentos,
  templates,
  empresaNome,
  empresaWhatsapp,
  empresaEndereco,
}: {
  pagamentos: PagamentoLinha[];
  templates: Record<string, TemplateInfo>;
  empresaNome: string;
  empresaWhatsapp: string | null;
  empresaEndereco: string | null;
}) {
  const [, startTransition] = useTransition();
  const [recusando, setRecusando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  async function verComprovante(caminho: string) {
    // Abre a aba já no clique (sincrono) para o navegador nao bloquear
    // como pop-up - so depois, quando a URL assinada chega, e que
    // trocamos o destino dela.
    const aba = window.open("", "_blank");
    const resultado = await obterUrlComprovante(caminho);
    if (resultado.error) {
      aba?.close();
      toast.error(resultado.error);
      return;
    }
    if (resultado.url && aba) {
      aba.location.href = resultado.url;
    } else if (resultado.url) {
      window.open(resultado.url, "_blank");
    }
  }

  if (pagamentos.length === 0) {
    return (
      <div className="rounded-lg border py-10 text-center text-muted-foreground">
        Nenhum pagamento encontrado.
      </div>
    );
  }

  return (
    <>
      {/* Desktop: tabela. Some abaixo de md, vira lista de cartoes. */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
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
            {pagamentos.map((p) => {
              const { statusMeta, comprovante, botaoAviso } = montarLinha(p, templates, {
                empresaNome,
                empresaEndereco,
                empresaWhatsapp,
              });
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
                        {formatarData(p.agendamentos.data)} ·{" "}
                        {p.agendamentos.hora_inicio.slice(0, 5)}
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
                    <div className="flex flex-wrap gap-2">
                      {p.status === "em_analise" && (
                        <>
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
                        </>
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
                      {botaoAviso}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {pagamentos.map((p) => {
          const { statusMeta, comprovante, botaoAviso } = montarLinha(p, templates, {
            empresaNome,
            empresaEndereco,
            empresaWhatsapp,
          });
          return (
            <div key={p.id} className="space-y-3 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.agendamentos?.clientes?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.agendamentos?.clientes?.whatsapp}
                  </p>
                </div>
                <Badge variant={p.status === "pago" ? "default" : "secondary"} className="shrink-0">
                  {statusMeta?.label ?? p.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {p.agendamentos && (
                    <>
                      {formatarData(p.agendamentos.data)} ·{" "}
                      {p.agendamentos.hora_inicio.slice(0, 5)}
                    </>
                  )}
                </span>
                <span className="font-medium">{formatarMoeda(p.valor)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {comprovante && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => verComprovante(comprovante.arquivo_url)}
                  >
                    <FileText />
                    Ver comprovante
                  </Button>
                )}
                {p.status === "em_analise" && (
                  <>
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
                  </>
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
                {botaoAviso}
              </div>
            </div>
          );
        })}
      </div>

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
    </>
  );
}

function montarLinha(
  p: PagamentoLinha,
  templates: Record<string, TemplateInfo>,
  empresa: { empresaNome: string; empresaEndereco: string | null; empresaWhatsapp: string | null }
) {
  const comprovante = p.comprovantes_pagamentos?.[p.comprovantes_pagamentos.length - 1];
  const statusMeta = STATUS_PAGAMENTO_META[p.status];
  const tipoTemplateAviso =
    p.status === "pendente"
      ? "pagamento_aguardando"
      : p.status === "em_analise"
        ? "comprovante_recebido"
        : p.status === "pago"
          ? "pagamento_confirmado"
          : p.status === "recusado"
            ? "comprovante_recusado"
            : null;
  const templateAviso = tipoTemplateAviso ? templates[tipoTemplateAviso] : undefined;
  const botaoAviso = p.agendamentos && (
    <EnviarMensagemButton
      templateId={templateAviso?.id}
      conteudo={templateAviso?.conteudo}
      clienteId={p.agendamentos.clientes?.id ?? ""}
      clienteNome={p.agendamentos.clientes?.nome ?? ""}
      clienteWhatsapp={p.agendamentos.clientes?.whatsapp}
      agendamentoId={p.agendamentos.id}
      nomeProfissional={p.agendamentos.profissionais?.nome ?? ""}
      servico={p.agendamentos.servicos?.nome ?? ""}
      data={p.agendamentos.data}
      horaInicio={p.agendamentos.hora_inicio}
      valorTotal={p.agendamentos.valor_total}
      valorEntrada={p.agendamentos.valor_entrada}
      valorRestante={p.agendamentos.valor_restante}
      empresaNome={empresa.empresaNome}
      empresaEndereco={empresa.empresaEndereco}
      empresaWhatsapp={empresa.empresaWhatsapp}
    />
  );
  return { statusMeta, comprovante, botaoAviso };
}
