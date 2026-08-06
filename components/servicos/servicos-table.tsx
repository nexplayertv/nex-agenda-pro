"use client";

import { useTransition } from "react";
import { MoreHorizontal, Pencil, Star, EyeOff, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Can } from "@/hooks/use-permissions";
import { formatarDuracao, formatarMoeda } from "@/lib/utils-domain/masks";
import { alternarStatusServico } from "@/app/(app)/servicos/actions";
import {
  ServicoFormDialog,
  type CategoriaOpcao,
  type ServicoExistente,
} from "./servico-form-dialog";

export type ServicoLinha = ServicoExistente & {
  status: "ativo" | "inativo";
  categorias_servicos: { nome: string } | null;
};

export function ServicosTable({
  servicos,
  categorias,
}: {
  servicos: ServicoLinha[];
  categorias: CategoriaOpcao[];
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Catálogo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicos.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                Nenhum serviço cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
          {servicos.map((servico) => (
            <TableRow key={servico.id}>
              <TableCell>
                <div className="flex items-center gap-1.5 font-medium">
                  {servico.destaque && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                  {servico.nome}
                </div>
              </TableCell>
              <TableCell>{servico.categorias_servicos?.nome ?? "—"}</TableCell>
              <TableCell>{formatarMoeda(servico.valor)}</TableCell>
              <TableCell>{formatarDuracao(servico.duracao_minutos)}</TableCell>
              <TableCell>
                {servico.visivel_catalogo ? (
                  <Badge variant="outline">Visível</Badge>
                ) : (
                  <Badge variant="secondary">
                    <EyeOff className="size-3" /> Oculto
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={servico.status === "ativo" ? "default" : "secondary"}>
                  {servico.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
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
                      <ServicoFormDialog
                        servico={servico}
                        categorias={categorias}
                        trigger={
                          <DropdownMenuItem
                            closeOnClick={false}
                            render={
                              <button type="button" className="w-full">
                                <Pencil />
                                Editar
                              </button>
                            }
                          />
                        }
                      />
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
