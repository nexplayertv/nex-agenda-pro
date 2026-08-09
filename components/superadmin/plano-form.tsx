"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarPlano, type ActionState } from "@/app/(superadmin)/planos/actions";

const initialState: ActionState = { error: null };

export function PlanoForm({ nome, trialDias }: { nome: string; trialDias: number }) {
  const [state, formAction, pending] = useActionState(salvarPlano, initialState);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Plano AgendaPro</CardTitle>
        <CardDescription>
          Nome do produto e tempo de teste grátis. Os preços ficam nos ciclos de cobrança abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do plano</Label>
            <Input id="nome" name="nome" defaultValue={nome} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trialDias">Dias de teste grátis</Label>
            <Input
              id="trialDias"
              name="trialDias"
              type="number"
              min="0"
              defaultValue={trialDias}
              className="max-w-32"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Os dias de teste só valem para empresas novas cadastradas depois dessa mudança —
            empresas já em teste mantêm o prazo original.
          </p>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.sucesso && !state.error && (
            <p className="text-sm text-emerald-600">Plano salvo.</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
