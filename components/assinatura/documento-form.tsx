"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  salvarDocumentoEmpresa,
  type DocumentoState,
} from "@/app/(app)/assinatura/actions";

const initialState: DocumentoState = { error: null };

export function DocumentoForm({ cnpjCpf }: { cnpjCpf: string | null }) {
  const [state, formAction, pending] = useActionState(salvarDocumentoEmpresa, initialState);

  return (
    <form action={formAction} className="space-y-2 rounded-lg border p-3">
      <Label htmlFor="cnpjCpf">CPF ou CNPJ da empresa</Label>
      <p className="text-xs text-muted-foreground">
        Exigido pelo gateway de pagamento para gerar a cobrança da renovação.
      </p>
      <div className="flex flex-wrap gap-2">
        <Input
          id="cnpjCpf"
          name="cnpjCpf"
          defaultValue={cnpjCpf ?? ""}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.sucesso && !state.error && (
        <p className="text-sm text-emerald-600">Salvo.</p>
      )}
    </form>
  );
}
