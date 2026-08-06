"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { salvarPagamento, type ActionState } from "@/app/(app)/configuracoes/actions";

const initialState: ActionState = { error: null };

export function PagamentoForm({
  percentualEntrada,
  prazoReservaMinutos,
  prazoComprovanteMinutos,
  prazoAnaliseComprovanteMinutos,
  politicaCancelamento,
}: {
  percentualEntrada: number;
  prazoReservaMinutos: number;
  prazoComprovanteMinutos: number;
  prazoAnaliseComprovanteMinutos: number;
  politicaCancelamento: string | null;
}) {
  const [state, formAction, pending] = useActionState(salvarPagamento, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="percentualEntrada">Porcentagem de entrada (aplicada a todos os serviços)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="percentualEntrada"
            name="percentualEntrada"
            type="number"
            min="0"
            max="100"
            defaultValue={percentualEntrada}
            className="max-w-32"
            required
          />
          <span className="text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Alterar aqui só afeta novos agendamentos — os já criados mantêm o percentual original.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prazoReservaMinutos">Prazo da reserva (min)</Label>
          <Input
            id="prazoReservaMinutos"
            name="prazoReservaMinutos"
            type="number"
            min="1"
            defaultValue={prazoReservaMinutos}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prazoComprovanteMinutos">Prazo p/ comprovante (min)</Label>
          <Input
            id="prazoComprovanteMinutos"
            name="prazoComprovanteMinutos"
            type="number"
            min="1"
            defaultValue={prazoComprovanteMinutos}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prazoAnaliseComprovanteMinutos">Prazo p/ analisar (min)</Label>
          <Input
            id="prazoAnaliseComprovanteMinutos"
            name="prazoAnaliseComprovanteMinutos"
            type="number"
            min="1"
            defaultValue={prazoAnaliseComprovanteMinutos}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="politicaCancelamento">Política de cancelamento</Label>
        <Textarea
          id="politicaCancelamento"
          name="politicaCancelamento"
          rows={3}
          defaultValue={politicaCancelamento ?? ""}
          placeholder="Ex: cancelamentos com menos de 24h não têm a entrada reembolsada."
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.sucesso && !state.error && (
        <p className="text-sm text-emerald-600">Configurações de pagamento salvas.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
