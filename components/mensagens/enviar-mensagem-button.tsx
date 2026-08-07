"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { montarVariaveis, renderizarTemplate, whatsappLink } from "@/lib/mensagens/template";
import { registrarMensagemEnviada } from "@/app/(app)/mensagens/actions";

export function EnviarMensagemButton({
  templateId,
  conteudo,
  clienteId,
  clienteNome,
  clienteWhatsapp,
  agendamentoId,
  nomeProfissional,
  servico,
  data,
  horaInicio,
  valorTotal,
  valorEntrada,
  valorRestante,
  empresaNome,
  empresaEndereco,
  empresaWhatsapp,
  label = "Avisar cliente",
}: {
  templateId: string | null | undefined;
  conteudo: string | null | undefined;
  clienteId: string;
  clienteNome: string;
  clienteWhatsapp: string | null | undefined;
  agendamentoId: string;
  nomeProfissional: string;
  servico: string;
  data: string;
  horaInicio: string;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  empresaNome: string;
  empresaEndereco?: string | null;
  empresaWhatsapp?: string | null;
  label?: string;
}) {
  if (!templateId || !conteudo || !clienteWhatsapp) return null;

  const texto = renderizarTemplate(
    conteudo,
    montarVariaveis({
      nomeCliente: clienteNome,
      nomeEmpresa: empresaNome,
      nomeProfissional,
      servico,
      data,
      horaInicio,
      valorTotal,
      valorEntrada,
      valorRestante,
      endereco: empresaEndereco,
      whatsappEmpresa: empresaWhatsapp,
    })
  );

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      render={
        <a
          href={whatsappLink(clienteWhatsapp, texto)}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            void registrarMensagemEnviada({ clienteId, agendamentoId, templateId, conteudoFinal: texto })
          }
        />
      }
    >
      <MessageCircle />
      {label}
    </Button>
  );
}
