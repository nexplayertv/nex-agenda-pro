"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Search, Shield, User } from "lucide-react";
import { sair } from "@/app/(public)/login/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { ThemeToggle } from "@/components/theme-toggle";
import { AssinaturaBadge } from "@/components/layout/assinatura-badge";
import { NotificationBell, type NotificacaoResumo } from "./notification-bell";

export function AppHeader({
  nome,
  email,
  fotoUrl,
  notificacoes,
  naoLidas,
  vencimento,
  diasRestantes,
}: {
  nome: string;
  email: string;
  fotoUrl: string | null;
  notificacoes: NotificacaoResumo[];
  naoLidas: number;
  vencimento?: string | null;
  diasRestantes?: number | null;
}) {
  const { can, isSuperadmin } = usePermissions();
  const router = useRouter();
  const [, startTransition] = useTransition();
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
        {vencimento && diasRestantes !== null && diasRestantes !== undefined && (
          <AssinaturaBadge vencimento={vencimento} diasRestantes={diasRestantes} />
        )}
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
            <div className="px-1.5 py-1">
              <p className="text-sm font-medium">{nome}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/configuracoes">Configurações</Link>} />
            {isSuperadmin && (
              <DropdownMenuItem
                render={
                  <Link href="/empresas">
                    <Shield />
                    Painel da plataforma
                  </Link>
                }
              />
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  await sair();
                  router.push("/login");
                  router.refresh();
                })
              }
            >
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
