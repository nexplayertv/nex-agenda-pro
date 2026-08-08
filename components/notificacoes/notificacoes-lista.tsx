"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatarData } from "@/lib/utils-domain/masks";
import {
  apagarTodasNotificacoes,
  marcarNotificacaoLida,
  marcarTodasLidas,
} from "@/app/(app)/notificacoes/actions";
import type { NotificacaoResumo } from "@/components/layout/notification-bell";

export function NotificacoesLista({ notificacoes }: { notificacoes: NotificacaoResumo[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  function executar(acao: () => Promise<void>) {
    startTransition(async () => {
      await acao();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {naoLidas > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => executar(marcarTodasLidas)}
          >
            <Check />
            {pending ? "Marcando..." : "Marcar todas como lidas"}
          </Button>
        )}
        {notificacoes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setConfirmandoLimpeza(true)}
          >
            <Trash2 />
            Limpar todas
          </Button>
        )}
      </div>

      <Dialog open={confirmandoLimpeza} onOpenChange={setConfirmandoLimpeza}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Limpar todas as notificações?</DialogTitle>
            <DialogDescription>
              Isso apaga o histórico de notificações da empresa. Não afeta agendamentos, pagamentos
              nem clientes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await apagarTodasNotificacoes();
                  setConfirmandoLimpeza(false);
                  router.refresh();
                })
              }
            >
              {pending ? "Apagando..." : "Apagar tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notificacoes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Bell className="size-8" />
            <p>Nenhuma notificação ainda.</p>
          </CardContent>
        </Card>
      )}

      {notificacoes.map((n) => (
        <Card key={n.id} className={!n.lida ? "border-primary/40" : undefined}>
          <CardContent className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{n.titulo}</p>
                {!n.lida && <Badge className="h-4 px-1.5 text-[10px]">Nova</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{n.mensagem}</p>
              <p className="text-xs text-muted-foreground">{formatarData(n.criado_em)}</p>
              {n.link && (
                <Link href={n.link} className="text-xs text-primary hover:underline">
                  Ver detalhes
                </Link>
              )}
            </div>
            {!n.lida && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => executar(() => marcarNotificacaoLida(n.id))}
              >
                Marcar como lida
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
