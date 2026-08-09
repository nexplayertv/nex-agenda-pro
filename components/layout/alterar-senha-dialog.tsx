"use client";

import { useActionState, useState } from "react";
import { KeyRound } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AlterarSenhaState = { error: null };

export function AlterarSenhaDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(alterarSenha, initialState);
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <DropdownMenuItem
            closeOnClick={false}
            render={
              <button type="button" className="w-full">
                <KeyRound />
                Alterar senha
              </button>
            }
          />
        }
      />
      <DialogContent className="sm:max-w-sm">
        <form action={formAction} key={open ? "open" : "closed"}>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Informe sua senha atual e escolha uma nova.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input id="senhaAtual" name="senhaAtual" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input id="novaSenha" name="novaSenha" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
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
