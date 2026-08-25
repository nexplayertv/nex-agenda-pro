"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopiarLinkAgendamentoButton({ slug }: { slug: string }) {
  function copiar() {
    const url = `${window.location.origin}/agendar/${slug}`;
    navigator.clipboard?.writeText(url);
    toast.success("Link de agendamento copiado.");
  }

  return (
    <Button type="button" variant="outline" size="icon" title="Copiar link de agendamento" onClick={copiar}>
      <Link2 />
    </Button>
  );
}
