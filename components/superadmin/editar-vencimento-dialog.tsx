"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { definirVencimento } from "@/app/(superadmin)/empresas/actions";

// Controlado de fora (ver empresa-acoes.tsx): o Dialog precisa ficar fora
// da arvore do DropdownMenu que o abre, senao ele e desmontado junto
// quando o menu fecha (mesmo passando por portal, continua sendo filho
// React do menu).
export function EditarVencimentoDialog({
  empresaId,
  vencimentoAtual,
  open,
  onOpenChange,
}: {
  empresaId: string;
  vencimentoAtual: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState(vencimentoAtual ? vencimentoAtual.slice(0, 10) : "");
  const [pending, startTransition] = useTransition();

  function salvar() {
    if (!data) return;
    startTransition(async () => {
      const res = await definirVencimento(empresaId, data);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Vencimento atualizado.");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Editar vencimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="novoVencimento">Nova data de vencimento</Label>
          <Input
            id="novoVencimento"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={salvar} disabled={pending || !data}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
