import type { Recurso } from "@/lib/permissions/catalog";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  Users,
  Sparkles,
  UserRound,
  UsersRound,
  Wallet,
  CreditCard,
  Landmark,
  Store,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  recurso: Recurso;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, recurso: "dashboard" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, recurso: "agenda" },
  { href: "/agendamentos/novo", label: "Novo agendamento", icon: CalendarPlus, recurso: "agendamentos" },
  { href: "/clientes", label: "Clientes", icon: Users, recurso: "clientes" },
  { href: "/servicos", label: "Serviços", icon: Sparkles, recurso: "servicos" },
  { href: "/profissionais", label: "Profissionais", icon: UserRound, recurso: "profissionais" },
  { href: "/funcionarios", label: "Funcionários", icon: UsersRound, recurso: "funcionarios" },
  { href: "/pagamentos-entrada", label: "Pagamentos de entrada", icon: Wallet, recurso: "pagamentos" },
  { href: "/gateways", label: "Gateways de pagamento", icon: CreditCard, recurso: "gateways" },
  { href: "/financeiro", label: "Financeiro", icon: Landmark, recurso: "financeiro" },
  { href: "/catalogo", label: "Catálogo público", icon: Store, recurso: "catalogo_publico" },
  { href: "/mensagens", label: "Mensagens e templates", icon: MessageSquare, recurso: "mensagens" },
  { href: "/notificacoes", label: "Notificações", icon: Bell, recurso: "notificacoes" },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, recurso: "relatorios" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, recurso: "configuracoes" },
];
