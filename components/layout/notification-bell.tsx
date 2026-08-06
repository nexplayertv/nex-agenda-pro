"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { marcarNotificacaoLida, marcarTodasLidas } from "@/app/(app)/notificacoes/actions";

export type NotificacaoResumo = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  criado_em: string;
};

export function NotificationBell({
  notificacoes,
  naoLidas,
}: {
  notificacoes: NotificacaoResumo[];
  naoLidas: number;
}) {
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
            <Bell />
            {naoLidas > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                {naoLidas > 9 ? "9+" : naoLidas}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Notificações</p>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => startTransition(() => marcarTodasLidas())}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notificacoes.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação por aqui.
          </p>
        )}
        <div className="max-h-80 overflow-y-auto">
          {notificacoes.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-0.5 whitespace-normal"
              onClick={() => !n.lida && startTransition(() => marcarNotificacaoLida(n.id))}
              render={
                n.link ? (
                  <Link href={n.link}>
                    <span className={`text-sm ${!n.lida ? "font-semibold" : ""}`}>{n.titulo}</span>
                    <span className="text-xs text-muted-foreground">{n.mensagem}</span>
                  </Link>
                ) : (
                  <div>
                    <span className={`text-sm ${!n.lida ? "font-semibold" : ""}`}>{n.titulo}</span>
                    <span className="block text-xs text-muted-foreground">{n.mensagem}</span>
                  </div>
                )
              }
            />
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/notificacoes">Ver todas</Link>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
