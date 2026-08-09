import { Lock } from "lucide-react";
import { formatarData } from "@/lib/utils-domain/masks";
import { RenovarAssinaturaButton } from "@/components/assinatura/renovar-button";
import { SairButton } from "@/components/layout/sair-button";

export function AcessoBloqueado({ vencimento }: { vencimento: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-end p-4">
        <SairButton />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Acesso suspenso</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sua assinatura do AgendaPro venceu em {formatarData(vencimento)}. Renove para
          continuar usando o painel administrativo.
        </p>
        <RenovarAssinaturaButton size="lg" className="mt-2" />
      </div>
    </div>
  );
}
