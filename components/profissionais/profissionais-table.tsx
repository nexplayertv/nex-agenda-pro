"use client";

import { useTransition } from "react";
import { MoreHorizontal, Pencil, Power } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { alternarStatusProfissional } from "@/app/(app)/profissionais/actions";
import {
  ProfissionalFormDialog,
  type ProfissionalExistente,
} from "./profissional-form-dialog";
import type { HorarioExistente } from "./horarios-editor";

export type ProfissionalLinha = ProfissionalExistente & {
  status: "ativo" | "inativo";
  horarios_funcionamento: HorarioExistente[];
};

export function ProfissionaisTable({ profissionais }: { profissionais: ProfissionalLinha[] }) {
  const [, startTransition] = useTransition();

  function acoes(p: ProfissionalLinha) {
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
          <Can recurso="profissionais" acao="editar">
            <ProfissionalFormDialog
              profissional={p}
              horarios={p.horarios_funcionamento}
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
          <Can recurso="profissionais" acao="excluir">
            <DropdownMenuItem
              variant={p.status === "ativo" ? "destructive" : "default"}
              onClick={() =>
                startTransition(() => alternarStatusProfissional(p.id, p.status !== "ativo"))
              }
            >
              <Power />
              {p.status === "ativo" ? "Desativar" : "Reativar"}
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (profissionais.length === 0) {
    return (
      <div className="rounded-lg border py-10 text-center text-muted-foreground">
        Nenhum profissional cadastrado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profissionais.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7" style={{ backgroundColor: p.cor_agenda }}>
                      {p.foto_url && <AvatarImage src={p.foto_url} alt={p.nome} />}
                      <AvatarFallback className="text-white" style={{ backgroundColor: p.cor_agenda }}>
                        {p.nome[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{p.nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.telefone ?? p.email ?? "—"}
                </TableCell>
                <TableCell className="max-w-48 truncate text-sm">
                  {p.especialidades?.join(", ") || "—"}
                </TableCell>
                <TableCell>{p.comissao_percentual ?? 0}%</TableCell>
                <TableCell>
                  <Badge variant={p.status === "ativo" ? "default" : "secondary"}>
                    {p.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>{acoes(p)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {profissionais.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
            <Avatar className="size-9 shrink-0" style={{ backgroundColor: p.cor_agenda }}>
              {p.foto_url && <AvatarImage src={p.foto_url} alt={p.nome} />}
              <AvatarFallback className="text-white" style={{ backgroundColor: p.cor_agenda }}>
                {p.nome[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.telefone ?? p.email ?? "—"} · Comissão {p.comissao_percentual ?? 0}%
              </p>
            </div>
            <Badge variant={p.status === "ativo" ? "default" : "secondary"} className="shrink-0">
              {p.status === "ativo" ? "Ativo" : "Inativo"}
            </Badge>
            {acoes(p)}
          </div>
        ))}
      </div>
    </>
  );
}
