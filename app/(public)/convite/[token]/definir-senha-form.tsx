"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { definirSenhaConvite, type DefinirSenhaState } from "./actions";

const initialState: DefinirSenhaState = { error: null };

export function DefinirSenhaForm({ token }: { token: string }) {
  const action = definirSenhaConvite.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="senha">Nova senha</Label>
        <Input id="senha" name="senha" type="password" required minLength={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmarSenha">Confirmar senha</Label>
        <Input id="confirmarSenha" name="confirmarSenha" type="password" required minLength={8} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Concluindo..." : "Criar senha e entrar"}
      </Button>
    </form>
  );
}
