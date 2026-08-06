"use client";

import { useActionState, useState } from "react";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarCliente, editarCliente, type ActionState } from "@/app/(app)/clientes/actions";

export type ClienteExistente = {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  observacoes: string | null;
  preferencias: string | null;
};

const initialState: ActionState = { error: null };

export function ClienteFormDialog({
  cliente,
  trigger,
}: {
  cliente?: ClienteExistente;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = cliente ? editarCliente.bind(null, cliente.id) : criarCliente;
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>
              Dados usados na agenda, no catálogo e no histórico de atendimentos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" name="nome" defaultValue={cliente?.nome} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={cliente?.whatsapp ?? ""}
                  placeholder="(11) 90000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Nascimento</Label>
                <Input
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  defaultValue={cliente?.data_nascimento ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" name="endereco" defaultValue={cliente?.endereco ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferencias">Preferências</Label>
              <Input
                id="preferencias"
                name="preferencias"
                defaultValue={cliente?.preferencias ?? ""}
                placeholder="Ex: prefere unhas curtas, alergia a determinado produto..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações internas</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                defaultValue={cliente?.observacoes ?? ""}
                rows={3}
              />
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
