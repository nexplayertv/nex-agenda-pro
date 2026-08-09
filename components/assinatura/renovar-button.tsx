"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarMoeda } from "@/lib/utils-domain/masks";
import { renovarAssinatura } from "@/app/(app)/assinatura/actions";

export type CicloOpcao = { id: string; nome: string; periodo_dias: number; valor: number };

export function RenovarAssinaturaButton({
  ciclos,
  className,
  size = "default",
}: {
  ciclos: CicloOpcao[];
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const [pending, startTransition] = useTransition();
  const [cicloId, setCicloId] = useState(ciclos[0]?.id ?? "");

  function renovar() {
    if (!cicloId) return;
    startTransition(async () => {
      const resultado = await renovarAssinatura(cicloId);
      if (resultado.error) {
        toast.error(resultado.error);
        return;
      }
      if (resultado.urlPagamento) {
        window.location.href = resultado.urlPagamento;
      }
    });
  }

  if (ciclos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum ciclo de cobrança disponível no momento. Fale com o suporte para renovar.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ciclos.length > 1 ? (
        <div className="max-w-xs space-y-2">
          <Label htmlFor="cicloCobranca">Período</Label>
          <Select
            items={Object.fromEntries(
              ciclos.map((c) => [c.id, `${c.nome} — ${formatarMoeda(c.valor)}`])
            )}
            name="cicloCobranca"
            value={cicloId}
            onValueChange={(v) => setCicloId(v ?? "")}
          >
            <SelectTrigger id="cicloCobranca" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ciclos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} — {formatarMoeda(c.valor)} ({c.periodo_dias} dias)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <Button className={className} size={size} disabled={pending} onClick={renovar}>
        <CreditCard />
        {pending ? "Gerando cobrança..." : "Renovar agora"}
      </Button>
    </div>
  );
}
