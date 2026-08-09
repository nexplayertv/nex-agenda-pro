"use client";

import { useActionState } from "react";
import { alterarSenha, type AlterarSenhaState } from "@/app/(app)/conta/actions";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: AlterarSenhaState = { error: null };

// Controlado de fora (ver app-header.tsx): o Dialog precisa ficar fora da
// arvore do DropdownMenu que o abre, senao ele e desmontado junto quando o
// menu fecha (mesmo passando por portal, continua sendo filho React do
// menu) - foi a causa do dialogo "piscar" (abrir e fechar na hora).
export function AlterarSenhaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(alterarSenha, initialState);
  useCloseOnSuccess(state, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>Informe sua senha atual e escolha uma nova.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <PasswordInput
                id="senhaAtual"
                name="senhaAtual"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <PasswordInput
                id="novaSenha"
                name="novaSenha"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <PasswordInput
                id="confirmarSenha"
                name="confirmarSenha"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
          </div>
          {state.error && <p className="pb-2 text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
