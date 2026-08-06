"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  History,
  KeyRound,
  Lock,
  MoreHorizontal,
  Pencil,
  Send,
  UserX,
  Unlock,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { formatarData } from "@/lib/utils-domain/masks";
import {
  bloquearFuncionario,
  reativarFuncionario,
  redefinirSenhaFuncionario,
  reenviarConvite,
} from "@/app/(app)/funcionarios/actions";
import { DesligarFuncionarioDialog } from "./desligar-funcionario-dialog";
import { EditarFuncionarioDialog, type FuncionarioExistente } from "./editar-funcionario-dialog";
import { HistoricoDialog } from "./historico-dialog";

const STATUS_LABEL: Record<string, string> = {
  convidado: "Convite pendente",
  ativo: "Ativo",
  bloqueado: "Bloqueado",
  desligado: "Desligado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  convidado: "outline",
  ativo: "default",
  bloqueado: "destructive",
  desligado: "secondary",
};

export type FuncionarioLinha = FuncionarioExistente & {
  status: "convidado" | "ativo" | "bloqueado" | "desligado";
  ultimo_acesso_em: string | null;
  cargos: { nome: string } | null;
};

export function FuncionariosTable({
  funcionarios,
  cargos,
  profissionais,
}: {
  funcionarios: FuncionarioLinha[];
  cargos: { id: string; nome: string }[];
  profissionais: { id: string; nome: string }[];
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {funcionarios.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                Nenhum funcionário cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
          {funcionarios.map((f) => (
            <TableRow key={f.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarFallback>{f.nome[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium leading-none">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{f.cargos?.nome ?? "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {f.ultimo_acesso_em ? formatarData(f.ultimo_acesso_em) : "Nunca"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[f.status]}>{STATUS_LABEL[f.status]}</Badge>
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
                    <Can recurso="funcionarios" acao="editar">
                      <EditarFuncionarioDialog
                        funcionario={f}
                        cargos={cargos}
                        profissionais={profissionais}
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

                    {f.usuario_id && (
                      <Can recurso="funcionarios" acao="visualizar">
                        <HistoricoDialog
                          usuarioId={f.usuario_id}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              render={
                                <button type="button" className="w-full">
                                  <History />
                                  Histórico de atividades
                                </button>
                              }
                            />
                          }
                        />
                      </Can>
                    )}

                    {f.status === "convidado" && (
                      <Can recurso="funcionarios" acao="editar">
                        <DropdownMenuItem
                          onClick={() =>
                            startTransition(async () => {
                              const r = await reenviarConvite(f.id);
                              if (r.link) {
                                navigator.clipboard?.writeText(r.link);
                                toast.success("Link de convite copiado para a área de transferência.");
                              } else if (r.error) {
                                toast.error(r.error);
                              }
                            })
                          }
                        >
                          <Send />
                          Reenviar convite
                        </DropdownMenuItem>
                      </Can>
                    )}

                    {f.status === "ativo" && (
                      <Can recurso="funcionarios" acao="editar">
                        <DropdownMenuItem
                          onClick={() =>
                            startTransition(async () => {
                              await redefinirSenhaFuncionario(f.email);
                            })
                          }
                        >
                          <KeyRound />
                          Redefinir senha
                        </DropdownMenuItem>
                      </Can>
                    )}

                    <Can recurso="funcionarios" acao="excluir">
                      {f.status === "ativo" && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            startTransition(async () => {
                              await bloquearFuncionario(f.id);
                            })
                          }
                        >
                          <Lock />
                          Bloquear acesso
                        </DropdownMenuItem>
                      )}
                      {f.status === "bloqueado" && (
                        <DropdownMenuItem
                          onClick={() =>
                            startTransition(async () => {
                              await reativarFuncionario(f.id);
                            })
                          }
                        >
                          <Unlock />
                          Reativar acesso
                        </DropdownMenuItem>
                      )}
                      {(f.status === "ativo" || f.status === "bloqueado") && (
                        <DesligarFuncionarioDialog
                          funcionarioId={f.id}
                          profissionalId={f.profissional_id}
                          outrosProfissionais={profissionais.filter(
                            (p) => p.id !== f.profissional_id
                          )}
                          trigger={
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={(e) => e.preventDefault()}
                              render={
                                <button type="button" className="w-full">
                                  <UserX />
                                  Desligar
                                </button>
                              }
                            />
                          }
                        />
                      )}
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
