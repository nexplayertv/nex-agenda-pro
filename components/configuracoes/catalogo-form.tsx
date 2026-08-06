"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { salvarCatalogo, type ActionState } from "@/app/(app)/configuracoes/actions";

const initialState: ActionState = { error: null };

export function CatalogoForm({
  catalogoPublicoAtivo,
  ocultarValoresCatalogo,
  moeda,
  fusoHorario,
}: {
  catalogoPublicoAtivo: boolean;
  ocultarValoresCatalogo: boolean;
  moeda: string;
  fusoHorario: string;
}) {
  const [state, formAction, pending] = useActionState(salvarCatalogo, initialState);
  const [ativo, setAtivo] = useState(catalogoPublicoAtivo);
  const [ocultarValores, setOcultarValores] = useState(ocultarValoresCatalogo);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Catálogo público ativo</p>
          <p className="text-xs text-muted-foreground">
            Permite que clientes agendem pelo link público.
          </p>
        </div>
        <input type="hidden" name="catalogoPublicoAtivo" value={ativo ? "true" : ""} />
        <Switch checked={ativo} onCheckedChange={setAtivo} />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Ocultar valores no catálogo</p>
          <p className="text-xs text-muted-foreground">
            Os clientes veem os serviços, mas não os preços, até agendar.
          </p>
        </div>
        <input type="hidden" name="ocultarValoresCatalogo" value={ocultarValores ? "true" : ""} />
        <Switch checked={ocultarValores} onCheckedChange={setOcultarValores} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="moeda">Moeda</Label>
          <Input id="moeda" name="moeda" defaultValue={moeda} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fusoHorario">Fuso horário</Label>
          <Input id="fusoHorario" name="fusoHorario" defaultValue={fusoHorario} />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.sucesso && !state.error && (
        <p className="text-sm text-emerald-600">Configurações salvas.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
