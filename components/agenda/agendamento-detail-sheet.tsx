"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Pencil, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Can } from "@/hooks/use-permissions";
import { STATUS_AGENDAMENTO_META } from "@/lib/agenda/status";
import { whatsappLink } from "@/lib/mensagens/template";
import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";
import { EnviarMensagemButton } from "@/components/mensagens/enviar-mensagem-button";
import {
  cancelarAgendamento,
  confirmarAgendamento,
  finalizarAtendimento,
  iniciarAtendimento,
  marcarNaoCompareceu,
} from "@/app/(app)/agendamentos/actions";
import { EditarAgendamentoDialog } from "./editar-agendamento-dialog";
import type { AgendamentoAgenda } from "./types";

type TemplateInfo = { id: string; conteudo: string };

export function AgendamentoDetailSheet({
  agendamento,
  profissionais,
  open,
  onOpenChange,
  templates,
  empresaNome,
  empresaEndereco,
  empresaWhatsapp,
}: {
  agendamento: AgendamentoAgenda | null;
  profissionais: { id: string; nome: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Record<string, TemplateInfo>;
  empresaNome: string;
  empresaEndereco: string | null;
  empresaWhatsapp: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [mostrarCancelamento, setMostrarCancelamento] = useState(false);
  const [editando, setEditando] = useState(false);
  const [avisoPosAcao, setAvisoPosAcao] = useState<string | null>(null);

  useEffect(() => {
    startTransition(() => setAvisoPosAcao(null));
  }, [agendamento?.id]);

  if (!agendamento) return null;
  const statusMeta = STATUS_AGENDAMENTO_META[agendamento.status];

  function executar(acao: () => Promise<unknown>) {
    startTransition(async () => {
      await acao();
      onOpenChange(false);
    });
  }

  function executarComAviso(acao: () => Promise<unknown>, tipoAviso: string) {
    startTransition(async () => {
      await acao();
      router.refresh();
      setAvisoPosAcao(tipoAviso);
    });
  }

  const templateAviso = avisoPosAcao ? templates[avisoPosAcao] : undefined;
  const botaoAviso = agendamento && avisoPosAcao && (
    <EnviarMensagemButton
      templateId={templateAviso?.id}
      conteudo={templateAviso?.conteudo}
      clienteId={agendamento.clientes?.id ?? ""}
      clienteNome={agendamento.clientes?.nome ?? ""}
      clienteWhatsapp={agendamento.clientes?.whatsapp}
      agendamentoId={agendamento.id}
      nomeProfissional={agendamento.profissionais?.nome ?? ""}
      servico={agendamento.servicos?.nome ?? ""}
      data={agendamento.data}
      horaInicio={agendamento.hora_inicio}
      valorTotal={agendamento.valor_total}
      valorEntrada={agendamento.valor_entrada}
      valorRestante={agendamento.valor_restante}
      empresaNome={empresaNome}
      empresaEndereco={empresaEndereco}
      empresaWhatsapp={empresaWhatsapp}
    />
  );

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{agendamento.servicos?.nome ?? "Agendamento"}</SheetTitle>
          <SheetDescription>
            {formatarData(agendamento.data)} · {agendamento.hora_inicio.slice(0, 5)} -{" "}
            {agendamento.hora_fim.slice(0, 5)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {statusMeta && <Badge className={statusMeta.className}>{statusMeta.label}</Badge>}

          <div className="space-y-1 rounded-lg border p-3">
            <p className="text-sm font-medium">{agendamento.clientes?.nome}</p>
            {agendamento.clientes?.whatsapp && (
              <p className="text-sm text-muted-foreground">{agendamento.clientes.whatsapp}</p>
            )}
            <div className="flex gap-2 pt-1">
              {agendamento.clientes?.whatsapp && (
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <a
                      href={whatsappLink(agendamento.clientes.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle />
                      WhatsApp
                    </a>
                  }
                />
              )}
              {agendamento.clientes?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link href={`/clientes?destaque=${agendamento.clientes.id}`}>
                      <Users />
                      Histórico
                    </Link>
                  }
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Profissional</p>
              <p className="font-medium">{agendamento.profissionais?.nome ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duração</p>
              <p className="font-medium">{agendamento.servicos?.duracao_minutos ?? "—"} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valor total</p>
              <p className="font-medium">{formatarMoeda(agendamento.valor_total)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entrada / Restante</p>
              <p className="font-medium">
                {formatarMoeda(agendamento.valor_entrada)} / {formatarMoeda(agendamento.valor_restante)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Forma de pagamento</p>
              <p className="font-medium">{agendamento.forma_pagamento ?? "—"}</p>
            </div>
          </div>

          {agendamento.observacoes && (
            <div>
              <p className="text-sm text-muted-foreground">Observações</p>
              <p className="text-sm">{agendamento.observacoes}</p>
            </div>
          )}

          {mostrarCancelamento && (
            <div className="space-y-2">
              <Textarea
                placeholder="Motivo do cancelamento (opcional)"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                rows={2}
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() =>
                  executarComAviso(
                    () => cancelarAgendamento(agendamento.id, motivoCancelamento),
                    "cancelamento"
                  )
                }
              >
                Confirmar cancelamento
              </Button>
            </div>
          )}

          {avisoPosAcao && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <p className="flex-1 text-sm text-muted-foreground">Avisar o cliente?</p>
              {botaoAviso}
            </div>
          )}
        </div>

        <SheetFooter className="flex-row flex-wrap gap-2">
          <Can recurso="agendamentos" acao="editar">
            {!["finalizado", "cancelado", "nao_compareceu", "reembolsado"].includes(
              agendamento.status
            ) && (
              <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
                <Pencil />
                Editar
              </Button>
            )}
          </Can>
          <Can recurso="agendamentos" acao="confirmar">
            {["aguardando_pagamento", "aguardando_comprovante", "pagamento_em_analise"].includes(
              agendamento.status
            ) && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() => executar(() => confirmarAgendamento(agendamento.id))}
              >
                Confirmar
              </Button>
            )}
            {agendamento.status === "confirmado" && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() => executar(() => iniciarAtendimento(agendamento.id))}
              >
                Iniciar atendimento
              </Button>
            )}
            {agendamento.status === "em_atendimento" && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  executarComAviso(
                    () => finalizarAtendimento(agendamento.id),
                    "solicitacao_avaliacao"
                  )
                }
              >
                Finalizar atendimento
              </Button>
            )}
            {["confirmado", "em_atendimento"].includes(agendamento.status) && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  executarComAviso(() => marcarNaoCompareceu(agendamento.id), "nao_compareceu")
                }
              >
                Não compareceu
              </Button>
            )}
          </Can>
          <Can recurso="agendamentos" acao="cancelar">
            {!["cancelado", "finalizado", "nao_compareceu", "reembolsado"].includes(
              agendamento.status
            ) && (
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => setMostrarCancelamento(true)}
              >
                Cancelar
              </Button>
            )}
          </Can>
        </SheetFooter>
      </SheetContent>
    </Sheet>

      <EditarAgendamentoDialog
        agendamento={agendamento}
        profissionais={profissionais}
        open={editando}
        onOpenChange={setEditando}
        onSalvo={() => {
          router.refresh();
          onOpenChange(false);
        }}
      />
    </>
  );
}
