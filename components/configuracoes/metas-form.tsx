"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarMetas, type ActionState } from "@/app/(app)/configuracoes/actions";

const initialState: ActionState = { error: null };

export function MetasForm({
  metaCrescimentoPercentual,
}: {
  metaCrescimentoPercentual: number | null;
}) {
  const [state, formAction, pending] = useActionState(salvarMetas, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="metaCrescimentoPercentual">Meta de crescimento sobre o mês anterior</Label>
        <div className="flex items-center gap-2">
          <Input
            id="metaCrescimentoPercentual"
            name="metaCrescimentoPercentual"
            type="number"
            min="0"
            max="1000"
            step="0.1"
            defaultValue={metaCrescimentoPercentual ?? ""}
            placeholder="Ex: 15"
            className="max-w-32"
          />
          <span className="text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Usada para calcular a projeção de vendas em Financeiro: a meta do mês é o faturamento
          do mês anterior + essa porcentagem. Deixe em branco para não usar projeção.
        </p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.sucesso && !state.error && <p className="text-sm text-emerald-600">Meta salva.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
