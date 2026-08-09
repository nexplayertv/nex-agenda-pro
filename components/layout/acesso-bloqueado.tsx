import { Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/mensagens/template";
import { formatarData } from "@/lib/utils-domain/masks";
import { RenovarAssinaturaButton } from "@/components/assinatura/renovar-button";
import { SairButton } from "@/components/layout/sair-button";

export function AcessoBloqueado({
  motivo,
  vencimento,
  whatsappSuporte,
}: {
  motivo: "vencimento" | "suspenso";
  vencimento?: string;
  whatsappSuporte?: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-end p-4">
        <SairButton />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Acesso suspenso</h1>
        {motivo === "vencimento" ? (
          <>
            <p className="max-w-sm text-sm text-muted-foreground">
              Sua assinatura do AgendaPro venceu em {vencimento ? formatarData(vencimento) : "—"}.
              Renove para continuar usando o painel administrativo.
            </p>
            <RenovarAssinaturaButton size="lg" className="mt-2" />
          </>
        ) : (
          <>
            <p className="max-w-sm text-sm text-muted-foreground">
              O acesso da sua empresa foi suspenso pelo administrador da plataforma. Entre em
              contato com o suporte para mais informações.
            </p>
            {whatsappSuporte && (
              <Button
                size="lg"
                className="mt-2"
                render={
                  <a
                    href={whatsappLink(whatsappSuporte, "Olá! Meu acesso ao AgendaPro foi suspenso e preciso de ajuda.")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle />
                    Falar com o suporte
                  </a>
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
