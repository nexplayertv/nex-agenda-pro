"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus, MoreHorizontal, Power, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  alternarAtivaEmpresa,
  excluirEmpresa,
  renovarManualmente,
} from "@/app/(superadmin)/empresas/actions";
import { EditarVencimentoDialog } from "./editar-vencimento-dialog";

export function EmpresaAcoes({
  empresaId,
  nome,
  ativa,
  vencimentoAtual,
}: {
  empresaId: string;
  nome: string;
  ativa: boolean;
  vencimentoAtual: string | null;
}) {
  const [, startTransition] = useTransition();
  const [confirmacao, setConfirmacao] = useState("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() =>
            startTransition(async () => {
              const res = await renovarManualmente(empresaId);
              if (res.error) toast.error(res.error);
              else toast.success("Vencimento renovado por mais 30 dias.");
            })
          }
        >
          <CalendarPlus />
          Renovar +30 dias
        </DropdownMenuItem>
        <EditarVencimentoDialog empresaId={empresaId} vencimentoAtual={vencimentoAtual} />
        <DropdownMenuItem
          variant={ativa ? "destructive" : "default"}
          onClick={() =>
            startTransition(async () => {
              const res = await alternarAtivaEmpresa(empresaId, !ativa);
              if (res.error) toast.error(res.error);
              else toast.success(ativa ? "Acesso desativado." : "Acesso reativado.");
            })
          }
        >
          <Power />
          {ativa ? "Desativar acesso" : "Reativar acesso"}
        </DropdownMenuItem>
        <AlertDialog onOpenChange={(open) => !open && setConfirmacao("")}>
          <AlertDialogTrigger
            render={
              <DropdownMenuItem
                closeOnClick={false}
                variant="destructive"
                render={
                  <button type="button" className="w-full">
                    <Trash2 />
                    Excluir empresa
                  </button>
                }
              />
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {nome}?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação é irreversível: apaga a empresa e TODOS os dados dela (clientes,
                agendamentos, financeiro, funcionários, tudo). Para confirmar, digite o nome
                exato da empresa abaixo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirmacaoExclusao">
                Digite <strong>{nome}</strong> para confirmar
              </Label>
              <Input
                id="confirmacaoExclusao"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder={nome}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={confirmacao !== nome}
                onClick={() =>
                  startTransition(async () => {
                    const res = await excluirEmpresa(empresaId);
                    if (res.error) toast.error(res.error);
                    else toast.success("Empresa excluída.");
                  })
                }
              >
                Excluir definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
