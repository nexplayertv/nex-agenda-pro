"use client";

import { useState, useTransition } from "react";
import { MessageCircle, MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react";
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
import { alternarStatusCliente } from "@/app/(app)/clientes/actions";
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

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-x-auto rounded-lg border">
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
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
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
                      {cliente.whatsapp && (
                        <DropdownMenuItem
                          render={
                            <a
                              href={whatsappLink(cliente.whatsapp)}
                              target="_blank"
                              rel="noreferrer"
                            >
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
                              onSelect={(e) => e.preventDefault()}
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
                            startTransition(() =>
                              alternarStatusCliente(cliente.id, cliente.status !== "ativo")
                            )
                          }
                        >
                          {cliente.status === "ativo" ? <UserX /> : <UserCheck />}
                          {cliente.status === "ativo" ? "Desativar" : "Reativar"}
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
    </div>
  );
}
