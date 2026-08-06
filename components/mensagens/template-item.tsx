"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { editarTemplate, type ActionState } from "@/app/(app)/mensagens/actions";

const initialState: ActionState = { error: null };

export function TemplateItem({
  id,
  titulo,
  conteudo,
}: {
  id: string;
  titulo: string;
  conteudo: string;
}) {
  const action = editarTemplate.bind(null, id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-sm font-semibold">{titulo}</p>
      <form action={formAction} className="space-y-2">
        <Textarea name="conteudo" defaultValue={conteudo} rows={2} />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          {state.error && <span className="text-xs text-destructive">{state.error}</span>}
          {state.sucesso && !state.error && (
            <span className="text-xs text-emerald-600">Salvo.</span>
          )}
        </div>
      </form>
    </div>
  );
}
