"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/utils-domain/masks";
import { enviarComprovanteAction, statusReservaAction } from "@/app/(public)/agendar/[empresaSlug]/actions";

export function PixPaymentStep({
  agendamentoId,
  empresaSlug,
  pixCopiaECola,
  chavePix,
  nomeTitular,
  banco,
  valorEntrada,
  qrCodeDataUrl,
}: {
  agendamentoId: string;
  empresaSlug: string;
  pixCopiaECola: string;
  chavePix: string;
  nomeTitular: string;
  banco: string;
  valorEntrada: number;
  qrCodeDataUrl: string | null;
}) {
  const [copiado, setCopiado] = useState<"chave" | "codigo" | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [statusAtual, setStatusAtual] = useState("aguardando_comprovante");

  useEffect(() => {
    const intervalo = setInterval(async () => {
      const resultado = await statusReservaAction(agendamentoId);
      if (resultado) setStatusAtual(resultado.status);
    }, 15000);
    return () => clearInterval(intervalo);
  }, [agendamentoId]);

  function copiar(texto: string, tipo: "chave" | "codigo") {
    navigator.clipboard?.writeText(texto);
    setCopiado(tipo);
    setTimeout(() => setCopiado(null), 2000);
  }

  function enviar() {
    if (!arquivo) return;
    setErro(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("comprovante", arquivo);
      const resultado = await enviarComprovanteAction(agendamentoId, formData);
      if (resultado.error) setErro(resultado.error);
      else setEnviado(true);
    });
  }

  if (statusAtual === "confirmado") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Check className="size-10 rounded-full bg-emerald-100 p-2 text-emerald-600" />
          <p className="text-lg font-semibold">Agendamento confirmado!</p>
          <p className="text-sm text-muted-foreground">
            Seu pagamento foi confirmado e o horário está garantido.
          </p>
          <Link
            href={`/agendar/${empresaSlug}/status`}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Consultar status depois
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (enviado || statusAtual === "comprovante_enviado" || statusAtual === "pagamento_em_analise") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-lg font-semibold">Comprovante enviado!</p>
          <p className="text-sm text-muted-foreground">
            Assim que a empresa confirmar o pagamento, seu horário fica garantido. Esta página
            atualiza automaticamente. Se preferir fechar esta aba, você pode consultar o status
            depois com seu nome e telefone.
          </p>
          <Link
            href={`/agendar/${empresaSlug}/status`}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Consultar status depois
          </Link>
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

        {qrCodeDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrCodeDataUrl} alt="QR Code Pix" className="mx-auto size-48" />
        )}

        <div className="space-y-1 rounded-lg border p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Titular:</span> {nomeTitular}
          </p>
          <p>
            <span className="text-muted-foreground">Banco:</span> {banco}
          </p>
          <p className="break-all">
            <span className="text-muted-foreground">Chave Pix:</span> {chavePix}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => copiar(chavePix, "chave")}>
            <Copy />
            {copiado === "chave" ? "Copiada!" : "Copiar chave"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => copiar(pixCopiaECola, "codigo")}>
            <Copy />
            {copiado === "codigo" ? "Copiado!" : "Copiar código Pix"}
          </Button>
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Depois de pagar, envie o comprovante</p>
          <Input
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button className="w-full" disabled={!arquivo || pending} onClick={enviar}>
            {pending ? "Enviando..." : "Enviar comprovante"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
