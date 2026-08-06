import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { sair } from "@/app/(public)/login/actions";
import { Button } from "@/components/ui/button";

const SUPERADMIN_NAV = [
  { href: "/empresas", label: "Empresas" },
  { href: "/planos", label: "Planos do SaaS" },
  { href: "/assinaturas", label: "Assinaturas" },
  { href: "/usuarios", label: "Usuários" },
  { href: "/financeiro-saas", label: "Financeiro do SaaS" },
  { href: "/configuracoes-plataforma", label: "Configurações da plataforma" },
];

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();

  if (!ctx) redirect("/login");
  if (!ctx.isSuperadmin) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <Link href="/empresas" className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="size-5 text-primary" />
          AgendaPro · Superadmin
        </Link>
        <nav className="ml-6 hidden gap-4 text-sm md:flex">
          {SUPERADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={sair} className="ml-auto">
          <Button variant="ghost" size="sm" type="submit">
            <LogOut />
            Sair
          </Button>
        </form>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
