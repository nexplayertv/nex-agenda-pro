"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/utils-domain/masks";
import { statusReservaAction } from "@/app/(public)/agendar/[empresaSlug]/actions";

export function AutomaticoPaymentStep({
  agendamentoId,
  empresaSlug,
  valorEntrada,
  pixCopiaECola,
  qrCodeBase64,
  urlPagamento,
}: {
  agendamentoId: string;
  empresaSlug: string;
  valorEntrada: number;
  pixCopiaECola?: string;
  qrCodeBase64?: string;
  urlPagamento?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [statusAtual, setStatusAtual] = useState("aguardando_pagamento");

  useEffect(() => {
    const intervalo = setInterval(async () => {
      const resultado = await statusReservaAction(agendamentoId);
      if (resultado) setStatusAtual(resultado.status);
    }, 5000);
    return () => clearInterval(intervalo);
  }, [agendamentoId]);

  function copiar() {
    if (!pixCopiaECola) return;
    navigator.clipboard?.writeText(pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (statusAtual === "confirmado") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Check className="size-10 rounded-full bg-emerald-100 p-2 text-emerald-600" />
          <p className="text-lg font-semibold">Agendamento confirmado!</p>
          <p className="text-sm text-muted-foreground">
            Seu pagamento foi confirmado automaticamente e o horário está garantido.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (statusAtual === "cancelado") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-lg font-semibold">Reserva expirada</p>
          <p className="text-sm text-muted-foreground">
            O prazo para pagamento acabou e o horário foi liberado. Volte e faça uma nova reserva.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Valor da entrada</p>
          <p className="text-2xl font-bold">{formatarMoeda(valorEntrada)}</p>
        </div>

        {qrCodeBase64 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrCodeBase64} alt="QR Code Pix" className="mx-auto size-48" />
        )}

        {pixCopiaECola && (
          <Button variant="outline" className="w-full" onClick={copiar}>
            <Copy />
            {copiado ? "Copiado!" : "Copiar código Pix"}
          </Button>
        )}

        {!pixCopiaECola && urlPagamento && (
          <Button className="w-full" render={<a href={urlPagamento} target="_blank" rel="noreferrer" />}>
            <ExternalLink />
            Ir para o pagamento
          </Button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Assim que o pagamento for identificado, esta página confirma sozinha — não precisa
          enviar comprovante nem avisar ninguém.
        </p>

        <div className="text-center">
          <Link
            href={`/agendar/${empresaSlug}/status`}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Consultar status depois
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
