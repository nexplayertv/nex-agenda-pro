"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarAparencia, type ActionState } from "@/app/(app)/configuracoes/actions";

const initialState: ActionState = { error: null };

export function AparenciaForm({
  logoUrl,
  corPrimaria,
  corSecundaria,
}: {
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
}) {
  const [state, formAction, pending] = useActionState(salvarAparencia, initialState);
  const [primaria, setPrimaria] = useState(corPrimaria);
  const [secundaria, setSecundaria] = useState(corSecundaria);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="logoUrl">URL do logotipo</Label>
        <Input id="logoUrl" name="logoUrl" placeholder="https://..." defaultValue={logoUrl ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="corPrimaria">Cor principal</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaria}
              onChange={(e) => setPrimaria(e.target.value)}
              className="h-9 w-12 rounded border"
            />
            <Input
              id="corPrimaria"
              name="corPrimaria"
              value={primaria}
              onChange={(e) => setPrimaria(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="corSecundaria">Cor secundária</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secundaria}
              onChange={(e) => setSecundaria(e.target.value)}
              className="h-9 w-12 rounded border"
            />
            <Input
              id="corSecundaria"
              name="corSecundaria"
              value={secundaria}
              onChange={(e) => setSecundaria(e.target.value)}
            />
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.sucesso && !state.error && (
        <p className="text-sm text-emerald-600">Aparência salva.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
