"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ProfissionaisHabilitadosEditor } from "@/components/servicos/profissionais-habilitados-editor";
import {
  criarCategoria,
  criarServico,
  editarServico,
  type ActionState,
} from "@/app/(app)/servicos/actions";

export type CategoriaOpcao = { id: string; nome: string };

export type ServicoExistente = {
  id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  valor: number;
  duracao_minutos: number;
  intervalo_minutos: number;
  destaque: boolean;
  visivel_catalogo: boolean;
  observacoes: string | null;
  profissionaisIds?: string[];
};

const initialState: ActionState = { error: null };

export function ServicoFormDialog({
  servico,
  categorias,
  profissionais,
  trigger,
}: {
  servico?: ServicoExistente;
  categorias: CategoriaOpcao[];
  profissionais: { id: string; nome: string }[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [listaCategorias, setListaCategorias] = useState(categorias);
  const [categoriaId, setCategoriaId] = useState(servico?.categoria_id ?? "");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [, startTransition] = useTransition();

  const action = servico ? editarServico.bind(null, servico.id) : criarServico;
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  async function adicionarCategoria() {
    if (!novaCategoria.trim()) return;
    startTransition(async () => {
      const resultado = await criarCategoria(novaCategoria.trim());
      if ("id" in resultado) {
        setListaCategorias((prev) => [...prev, { id: resultado.id, nome: novaCategoria.trim() }]);
        setCategoriaId(resultado.id);
        setNovaCategoria("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button>
              <Plus />
              Novo serviço
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{servico ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>
              A porcentagem de entrada é sempre a global definida em Configurações.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do serviço</Label>
              <Input id="nome" name="nome" defaultValue={servico?.nome} required />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <input type="hidden" name="categoriaId" value={categoriaId} />
              <div className="flex gap-2">
                <Select
                  items={Object.fromEntries(listaCategorias.map((c) => [c.id, c.nome]))}
                  value={categoriaId}
                  onValueChange={(value) => setCategoriaId(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {listaCategorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova categoria"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={adicionarCategoria}>
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={servico?.valor}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracaoMinutos">Duração (min)</Label>
                <Input
                  id="duracaoMinutos"
                  name="duracaoMinutos"
                  type="number"
                  min="1"
                  defaultValue={servico?.duracao_minutos}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervaloMinutos">Intervalo (min)</Label>
                <Input
                  id="intervaloMinutos"
                  name="intervaloMinutos"
                  type="number"
                  min="0"
                  defaultValue={servico?.intervalo_minutos ?? 0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                defaultValue={servico?.descricao ?? ""}
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="visivelCatalogo" defaultChecked={servico?.visivel_catalogo ?? true} />
                Visível no catálogo público
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="destaque" defaultChecked={servico?.destaque ?? false} />
                Serviço em destaque
              </label>
            </div>
          </div>

          {state.error && <p className="pb-2 text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>

        {servico && (
          <div className="space-y-2 border-t pt-4">
            <Label>Profissionais habilitados</Label>
            <p className="text-xs text-muted-foreground">
              Só profissionais marcados aqui aparecem para escolha no link público de agendamento.
            </p>
            <ProfissionaisHabilitadosEditor
              servicoId={servico.id}
              profissionais={profissionais}
              selecionadosIniciais={servico.profissionaisIds ?? []}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
