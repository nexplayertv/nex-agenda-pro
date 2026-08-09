"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenhaAdministrador } from "@/app/(superadmin)/empresas/actions";

export function RedefinirSenhaAdminDialog({
  empresaId,
  nome,
}: {
  empresaId: string;
  nome: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ email: string; senha: string } | null>(null);

  function gerar() {
    startTransition(async () => {
      const res = await redefinirSenhaAdministrador(empresaId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.email && res.senha) {
        setResultado({ email: res.email, senha: res.senha });
      }
    });
  }

  function copiar() {
    if (!resultado) return;
    navigator.clipboard?.writeText(resultado.senha);
    toast.success("Senha copiada.");
  }

  return (
    <>
      <DropdownMenuItem onClick={() => setTimeout(() => setOpen(true), 0)}>
        <KeyRound />
        Redefinir senha do admin
      </DropdownMenuItem>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setResultado(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir senha do administrador</DialogTitle>
            {!resultado && (
              <DialogDescription>
                Gera uma senha nova para o administrador de {nome}. A senha atual dele deixa de
                funcionar imediatamente.
              </DialogDescription>
            )}
          </DialogHeader>

          {resultado ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>E-mail do administrador</Label>
                <Input readOnly value={resultado.email} />
              </div>
              <div className="space-y-1">
                <Label>Senha nova</Label>
                <div className="flex gap-2">
                  <Input readOnly value={resultado.senha} className="font-mono" />
                  <Button type="button" size="icon" variant="outline" onClick={copiar}>
                    <Copy />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Envie essa senha por um canal seguro para o administrador e peça pra ele trocar
                depois de entrar.
              </p>
            </div>
          ) : (
            <DialogFooter>
              <Button onClick={gerar} disabled={pending}>
                {pending ? "Gerando..." : "Gerar nova senha"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
