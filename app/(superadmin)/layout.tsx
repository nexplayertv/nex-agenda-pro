import { redirect } from "next/navigation";
import Link from "next/link";
import { Store } from "lucide-react";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SairButton } from "@/components/layout/sair-button";
import { SuperadminSidebar } from "@/components/layout/superadmin-sidebar";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();

  if (!ctx) redirect("/login");
  if (!ctx.isSuperadmin) redirect("/dashboard");

  return (
    <SidebarProvider>
      <SuperadminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {ctx.empresaId && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href="/dashboard">
                    <Store />
                    Minha empresa
                  </Link>
                }
              />
            )}
            <SairButton />
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
