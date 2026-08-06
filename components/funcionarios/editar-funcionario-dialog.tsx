"use client";

import { useActionState, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { editarFuncionario, type ActionState } from "@/app/(app)/funcionarios/actions";

export type FuncionarioExistente = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cargo_id: string;
  profissional_id: string | null;
  observacoes: string | null;
  escopo_dados: "proprio" | "total";
  usuario_id: string | null;
};

const initialState: ActionState = { error: null };

export function EditarFuncionarioDialog({
  funcionario,
  cargos,
  profissionais,
  trigger,
}: {
  funcionario: FuncionarioExistente;
  cargos: { id: string; nome: string }[];
  profissionais: { id: string; nome: string }[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = editarFuncionario.bind(null, funcionario.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Editar funcionário</DialogTitle>
            <DialogDescription>{funcionario.email}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" name="nome" defaultValue={funcionario.nome} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" defaultValue={funcionario.telefone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargoId">Cargo</Label>
              <Select
                items={Object.fromEntries(cargos.map((c) => [c.id, c.nome]))}
                name="cargoId"
                defaultValue={funcionario.cargo_id}
                required
              >
                <SelectTrigger id="cargoId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profissionalId">Profissional vinculado</Label>
              <Select
                items={Object.fromEntries(profissionais.map((p) => [p.id, p.nome]))}
                name="profissionalId"
                defaultValue={funcionario.profissional_id ?? ""}
              >
                <SelectTrigger id="profissionalId" className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="escopoDados">Acesso aos dados</Label>
              <Select
                items={{
                  total: "Toda a empresa",
                  proprio: "Somente os próprios agendamentos/clientes/comissão",
                }}
                name="escopoDados"
                defaultValue={funcionario.escopo_dados}
              >
                <SelectTrigger id="escopoDados" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Toda a empresa</SelectItem>
                  <SelectItem value="proprio">
                    Somente os próprios agendamentos/clientes/comissão
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                defaultValue={funcionario.observacoes ?? ""}
                rows={2}
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
