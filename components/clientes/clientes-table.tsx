"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle, MoreHorizontal, Pencil, Trash2, UserX, UserCheck } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Can } from "@/hooks/use-permissions";
import { formatarData } from "@/lib/utils-domain/masks";
import { alternarStatusCliente, excluirCliente } from "@/app/(app)/clientes/actions";
import { ClienteFormDialog, type ClienteExistente } from "./cliente-form-dialog";

export type ClienteLinha = ClienteExistente & {
  status: "ativo" | "inativo";
  created_at: string;
};

function whatsappLink(numero: string) {
  return `https://wa.me/55${numero.replace(/\D/g, "")}`;
}

export function ClientesTable({ clientes }: { clientes: ClienteLinha[] }) {
  const [busca, setBusca] = useState("");
  const [, startTransition] = useTransition();

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function acoes(cliente: ClienteLinha) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {cliente.whatsapp && (
            <DropdownMenuItem
              render={
                <a href={whatsappLink(cliente.whatsapp)} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  WhatsApp
                </a>
              }
            />
          )}
          <Can recurso="clientes" acao="editar">
            <ClienteFormDialog
              cliente={cliente}
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
          <Can recurso="clientes" acao="excluir">
            <DropdownMenuItem
              variant={cliente.status === "ativo" ? "destructive" : "default"}
              onClick={() =>
                startTransition(() => alternarStatusCliente(cliente.id, cliente.status !== "ativo"))
              }
            >
              {cliente.status === "ativo" ? <UserX /> : <UserCheck />}
              {cliente.status === "ativo" ? "Desativar" : "Reativar"}
            </DropdownMenuItem>
          </Can>
          {cliente.status === "inativo" && (
          <Can recurso="clientes" acao="excluir">
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
                  <AlertDialogTitle>Excluir {cliente.nome}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita. O cadastro do cliente será apagado
                    definitivamente. Agendamentos e mensagens antigas ligadas a ele são mantidos
                    no histórico, só deixam de mostrar o nome do cliente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() =>
                      startTransition(async () => {
                        const res = await excluirCliente(cliente.id);
                        if (res.error) toast.error(res.error);
                        else toast.success("Cliente excluído.");
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
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-xs"
      />

      {filtrados.length === 0 ? (
        <div className="rounded-lg border py-10 text-center text-muted-foreground">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback>{cliente.nome[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{cliente.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.whatsapp ?? "—"}</TableCell>
                    <TableCell>{cliente.email ?? "—"}</TableCell>
                    <TableCell>{formatarData(cliente.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.status === "ativo" ? "default" : "secondary"}>
                        {cliente.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{acoes(cliente)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtrados.map((cliente) => (
              <div key={cliente.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback>{cliente.nome[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cliente.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cliente.whatsapp ?? cliente.email ?? "—"}
                  </p>
                </div>
                <Badge
                  variant={cliente.status === "ativo" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {cliente.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
                {acoes(cliente)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
