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

export function DocumentoForm({
  nomeCompleto,
  cnpjCpf,
}: {
  nomeCompleto: string | null;
  cnpjCpf: string | null;
}) {
  const [state, formAction, pending] = useActionState(salvarDocumentoEmpresa, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">
        Exigidos pelo gateway de pagamento para gerar a cobrança da renovação.
      </p>
      <div className="space-y-2">
        <Label htmlFor="nomeCompleto">Nome completo</Label>
        <Input
          id="nomeCompleto"
          name="nomeCompleto"
          defaultValue={nomeCompleto ?? ""}
          placeholder="Nome completo (pessoa física) ou razão social (empresa)"
          className="max-w-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnpjCpf">CPF ou CNPJ da empresa</Label>
        <Input
          id="cnpjCpf"
          name="cnpjCpf"
          defaultValue={cnpjCpf ?? ""}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className="max-w-xs"
        />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.sucesso && !state.error && (
        <p className="text-sm text-emerald-600">Salvo.</p>
      )}
    </form>
  );
}
