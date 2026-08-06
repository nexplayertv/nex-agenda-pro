"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LinkPublicoCard({
  link,
  ativo,
}: {
  link: string;
  ativo: boolean;
}) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(link, { width: 200, margin: 1 }).then(setQrCodeDataUrl);
  }, [link]);

  function copiarLink() {
    navigator.clipboard?.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Seu link de agendamento</CardTitle>
          <Badge variant={ativo ? "default" : "secondary"}>
            {ativo ? "Catálogo ativo" : "Catálogo desativado"}
          </Badge>
        </div>
        <CardDescription>
          Compartilhe esse link com seus clientes pelo WhatsApp, Instagram ou onde quiser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!ativo && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            O catálogo está desativado — clientes não conseguem agendar por esse link agora.
            Ative em <Link href="/configuracoes" className="underline">Configurações → Catálogo</Link>.
          </p>
        )}

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {qrCodeDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeDataUrl}
              alt="QR Code do link de agendamento"
              className="size-40 shrink-0 rounded-lg border"
            />
          )}
          <div className="w-full space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 text-sm break-all">{link}</div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copiarLink}>
                <Copy />
                {copiado ? "Link copiado!" : "Copiar link"}
              </Button>
              <Button
                variant="outline"
                render={
                  <a href={link} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    Abrir catálogo
                  </a>
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
