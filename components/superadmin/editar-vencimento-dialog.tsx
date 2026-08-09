"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { definirVencimento } from "@/app/(superadmin)/empresas/actions";

export function EditarVencimentoDialog({
  empresaId,
  vencimentoAtual,
}: {
  empresaId: string;
  vencimentoAtual: string | null;
}) {
  const [open, setOpen] = useState(false);
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
        setOpen(false);
      }
    });
  }

  return (
    <>
      <DropdownMenuItem onClick={() => setTimeout(() => setOpen(true), 0)}>
        <Pencil />
        Editar vencimento
      </DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
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
    </>
  );
}
