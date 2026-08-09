"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import {
  atualizarCiclo,
  criarCiclo,
  type ActionState,
} from "@/app/(superadmin)/planos/actions";

const initialState: ActionState = { error: null };

export type CicloExistente = {
  id: string;
  nome: string;
  periodo_dias: number;
  valor: number;
};

export function CicloFormDialog({
  ciclo,
  trigger,
}: {
  ciclo?: CicloExistente;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = ciclo ? atualizarCiclo.bind(null, ciclo.id) : criarCiclo;
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  const titulo = ciclo ? "Editar ciclo" : "Novo ciclo de cobrança";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button size="sm">
              <Plus />
              Adicionar ciclo
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-sm">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                defaultValue={ciclo?.nome}
                placeholder="Ex: Trimestral"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodoDias">Dias liberados</Label>
                <Input
                  id="periodoDias"
                  name="periodoDias"
                  type="number"
                  min="1"
                  defaultValue={ciclo?.periodo_dias}
                  placeholder="90"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={ciclo?.valor}
                  required
                />
              </div>
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
