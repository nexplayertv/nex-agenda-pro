"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Can } from "@/hooks/use-permissions";
import { alternarStatusServico, excluirServico } from "@/app/(app)/servicos/actions";
import {
  ServicoFormDialog,
  type CategoriaOpcao,
  type ServicoLinha,
} from "./servico-form-dialog";

export function ServicoAcoes({
  servico,
  categorias,
  profissionais,
}: {
  servico: ServicoLinha;
  categorias: CategoriaOpcao[];
  profissionais: { id: string; nome: string }[];
}) {
  const [, startTransition] = useTransition();
  const [editarOpen, setEditarOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <Can recurso="servicos" acao="editar">
            <DropdownMenuItem onClick={() => setEditarOpen(true)}>
              <Pencil />
              Editar
            </DropdownMenuItem>
          </Can>
          <Can recurso="servicos" acao="excluir">
            <DropdownMenuItem
              variant={servico.status === "ativo" ? "destructive" : "default"}
              onClick={() =>
                startTransition(() =>
                  alternarStatusServico(servico.id, servico.status !== "ativo")
                )
              }
            >
              <Power />
              {servico.status === "ativo" ? "Desativar" : "Reativar"}
            </DropdownMenuItem>
          </Can>
          {servico.status === "inativo" && (
            <Can recurso="servicos" acao="excluir">
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <DropdownMenuItem
                      closeOnClick={false}
                      variant="destructive"
                      render={
                        <button type="button" className="w-full">
                          <Trash2 />
                          Excluir
                        </button>
                      }
                    />
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {servico.nome}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita. Se o serviço já tiver agendamentos no
                      histórico, a exclusão será bloqueada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() =>
                        startTransition(async () => {
                          const res = await excluirServico(servico.id);
                          if (res.error) toast.error(res.error);
                          else toast.success("Serviço excluído.");
                        })
                      }
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Can>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ServicoFormDialog
        servico={{
          ...servico,
          profissionaisIds: servico.profissionais_servicos.map((p) => p.profissional_id),
        }}
        categorias={categorias}
        profissionais={profissionais}
        open={editarOpen}
        onOpenChange={setEditarOpen}
      />
    </>
  );
}
