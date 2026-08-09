"use client";

import { useActionState, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import {
  editarDespesa,
  editarReceita,
  registrarDespesa,
  registrarReceita,
  type ActionState,
} from "@/app/(app)/financeiro/actions";

const initialState: ActionState = { error: null };

export type LancamentoExistente = {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number;
  data: string;
  forma_pagamento?: string | null;
};

const CATEGORIAS_DESPESA = [
  "Aluguel",
  "Produtos/Estoque",
  "Salários/Comissões",
  "Contas (água, luz, internet)",
  "Marketing",
  "Manutenção",
  "Impostos",
  "Outros",
];

const CATEGORIAS_RECEITA = ["Entrada de agendamento", "Venda avulsa", "Produto", "Outros"];

const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito"];

export function LancamentoDialog({
  tipo,
  lancamento,
  trigger,
}: {
  tipo: "receita" | "despesa";
  lancamento?: LancamentoExistente;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const criarAction = tipo === "receita" ? registrarReceita : registrarDespesa;
  const editarAction = tipo === "receita" ? editarReceita : editarDespesa;
  const action = lancamento ? editarAction.bind(null, lancamento.id) : criarAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  const hoje = new Date().toISOString().slice(0, 10);
  const categorias = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const titulo = lancamento
    ? tipo === "receita"
      ? "Editar receita"
      : "Editar despesa"
    : tipo === "receita"
      ? "Registrar receita"
      : "Registrar despesa";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              <Plus />
              {titulo}
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
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                name="descricao"
                defaultValue={lancamento?.descricao}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                items={Object.fromEntries(categorias.map((c) => [c, c]))}
                name="categoria"
                defaultValue={lancamento?.categoria ?? undefined}
              >
                <SelectTrigger id="categoria" className="w-full">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={lancamento?.valor}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  defaultValue={lancamento?.data ?? hoje}
                  required
                />
              </div>
            </div>
            {tipo === "receita" && (
              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de pagamento</Label>
                <Select
                  items={Object.fromEntries(FORMAS_PAGAMENTO.map((f) => [f, f]))}
                  name="formaPagamento"
                  defaultValue={lancamento?.forma_pagamento ?? undefined}
                >
                  <SelectTrigger id="formaPagamento" className="w-full">
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
