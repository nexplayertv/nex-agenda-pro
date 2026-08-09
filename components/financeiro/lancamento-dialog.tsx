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
import { registrarDespesa, registrarReceita, type ActionState } from "@/app/(app)/financeiro/actions";

const initialState: ActionState = { error: null };

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

export function LancamentoDialog({ tipo }: { tipo: "receita" | "despesa" }) {
  const [open, setOpen] = useState(false);
  const action = tipo === "receita" ? registrarReceita : registrarDespesa;
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  const hoje = new Date().toISOString().slice(0, 10);
  const categorias = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus />
            {tipo === "receita" ? "Registrar receita" : "Registrar despesa"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>
              {tipo === "receita" ? "Registrar receita" : "Registrar despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" name="descricao" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select items={Object.fromEntries(categorias.map((c) => [c, c]))} name="categoria">
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
                <Input id="valor" name="valor" type="number" step="0.01" min="0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input id="data" name="data" type="date" defaultValue={hoje} required />
              </div>
            </div>
            {tipo === "receita" && (
              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de pagamento</Label>
                <Input id="formaPagamento" name="formaPagamento" placeholder="Dinheiro, Pix..." />
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
