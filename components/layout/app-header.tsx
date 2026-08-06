"use client";

import Link from "next/link";
import { LogOut, Search, User } from "lucide-react";
import { sair } from "@/app/(public)/login/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell, type NotificacaoResumo } from "./notification-bell";

export function AppHeader({
  nome,
  email,
  fotoUrl,
  notificacoes,
  naoLidas,
}: {
  nome: string;
  email: string;
  fotoUrl: string | null;
  notificacoes: NotificacaoResumo[];
  naoLidas: number;
}) {
  const { can } = usePermissions();
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar clientes, agendamentos..." className="pl-8" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {can("notificacoes", "visualizar") && (
          <NotificationBell notificacoes={notificacoes} naoLidas={naoLidas} />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarImage src={fotoUrl ?? undefined} alt={nome} />
                  <AvatarFallback>{iniciais || <User className="size-4" />}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">{nome}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{nome}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/configuracoes">Configurações</Link>} />
            <DropdownMenuSeparator />
            <form action={sair}>
              <DropdownMenuItem
                variant="destructive"
                render={
                  <button type="submit" className="w-full">
                    <LogOut />
                    Sair
                  </button>
                }
              />
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
