"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const SUPERADMIN_NAV = [
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/planos", label: "Planos do SaaS", icon: Package },
  { href: "/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/financeiro-saas", label: "Financeiro do SaaS", icon: Wallet },
  { href: "/configuracoes-plataforma", label: "Configurações da plataforma", icon: Settings },
];

export function SuperadminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <LayoutDashboard className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">AgendaPro</p>
            <p className="truncate text-xs text-muted-foreground">Superadmin</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SUPERADMIN_NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
