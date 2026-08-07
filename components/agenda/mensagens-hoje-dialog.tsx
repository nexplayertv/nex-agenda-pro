"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { montarVariaveis, renderizarTemplate, whatsappLink } from "@/lib/mensagens/template";
import { registrarMensagemEnviada } from "@/app/(app)/mensagens/actions";
import type { AgendamentoAgenda } from "./types";

type Template = { id: string; tipo: string; conteudo: string };

const TITULOS: Record<string, string> = {
  confirmacao_agendamento: "Confirmação do agendamento",
  lembrete_mesmo_dia: "Lembrete no mesmo dia",
  valor_restante_pendente: "Valor restante pendente",
  agradecimento: "Agradecimento",
};

export function MensagensHojeDialog({
  agendamentosHoje,
  templates,
  empresaNome,
  empresaWhatsapp,
  empresaEndereco,
}: {
  agendamentosHoje: AgendamentoAgenda[];
  templates: Template[];
  empresaNome: string;
  empresaWhatsapp: string | null;
  empresaEndereco: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  const template = templates.find((t) => t.id === templateId);
  const comCliente = agendamentosHoje.filter((a) => a.clientes?.whatsapp);

  const mensagens = useMemo(() => {
    if (!template) return new Map<string, string>();
    const mapa = new Map<string, string>();
    for (const a of comCliente) {
      const variaveis = montarVariaveis({
        nomeCliente: a.clientes?.nome ?? "",
        nomeEmpresa: empresaNome,
        nomeProfissional: a.profissionais?.nome ?? "",
        servico: a.servicos?.nome ?? "",
        data: a.data,
        horaInicio: a.hora_inicio,
        valorTotal: a.valor_total,
        valorEntrada: a.valor_entrada,
        valorRestante: a.valor_restante,
        endereco: empresaEndereco,
        whatsappEmpresa: empresaWhatsapp,
      });
      mapa.set(a.id, renderizarTemplate(template.conteudo, variaveis));
    }
    return mapa;
  }, [template, comCliente, empresaNome, empresaEndereco, empresaWhatsapp]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Send />
            Mensagens de hoje
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar mensagens para os clientes de hoje</DialogTitle>
          <DialogDescription>
            Escolha um template e abra o WhatsApp já com a mensagem pronta para cada cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select
            items={Object.fromEntries(templates.map((t) => [t.id, TITULOS[t.tipo] ?? t.tipo]))}
            value={templateId}
            onValueChange={(v) => setTemplateId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {TITULOS[t.tipo] ?? t.tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {comCliente.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum cliente com WhatsApp agendado para hoje.
              </p>
            )}
            {comCliente.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                <Checkbox checked disabled />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.clientes?.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.hora_inicio.slice(0, 5)} · {a.servicos?.nome}
                  </p>
                </div>
                {enviados.has(a.id) && (
                  <Badge variant="secondary" className="shrink-0">
                    Enviada
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <a
                      href={whatsappLink(a.clientes!.whatsapp!, mensagens.get(a.id) ?? "")}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        setEnviados((prev) => new Set(prev).add(a.id));
                        if (template) {
                          void registrarMensagemEnviada({
                            clienteId: a.clientes!.id,
                            agendamentoId: a.id,
                            templateId: template.id,
                            conteudoFinal: mensagens.get(a.id) ?? "",
                          });
                        }
                      }}
                    >
                      <MessageCircle />
                      Enviar
                    </a>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
