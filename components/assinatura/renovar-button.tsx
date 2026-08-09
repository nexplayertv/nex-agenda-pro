"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renovarAssinatura } from "@/app/(app)/assinatura/actions";

export function RenovarAssinaturaButton({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const [pending, startTransition] = useTransition();

  function renovar() {
    startTransition(async () => {
      const resultado = await renovarAssinatura();
      if (resultado.error) {
        toast.error(resultado.error);
        return;
      }
      if (resultado.urlPagamento) {
        window.location.href = resultado.urlPagamento;
      }
    });
  }

  return (
    <Button className={className} size={size} disabled={pending} onClick={renovar}>
      <CreditCard />
      {pending ? "Gerando cobrança..." : "Renovar agora"}
    </Button>
  );
}
