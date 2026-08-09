import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { AcessoBloqueado } from "@/components/layout/acesso-bloqueado";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PermissionsProvider } from "@/hooks/use-permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();

  if (!ctx) {
    redirect("/login");
  }

  if (!ctx.empresaId && !ctx.isSuperadmin) {
    // Usuario autenticado mas sem empresa ativa vinculada (ex.: convite
    // ainda nao aceito, ou empresa desativada).
    redirect("/login");
  }

  let empresaNome = "AgendaPro";
  let notificacoes: { id: string; titulo: string; mensagem: string; lida: boolean; link: string | null; criado_em: string }[] = [];
  let naoLidas = 0;
  let vencimento: string | null = null;
  let diasRestantes: number | null = null;

  if (ctx.empresaId) {
    const supabase = await createClient();
    const [{ data: empresa }, { data: notificacoesData }, { count }] = await Promise.all([
      supabase
        .from("empresas")
        .select("nome, trial_expira_em")
        .eq("id", ctx.empresaId)
        .single(),
      supabase
        .from("notificacoes")
        .select("id, titulo, mensagem, lida, link, criado_em")
        .eq("empresa_id", ctx.empresaId)
        .or(`usuario_id.is.null,usuario_id.eq.${ctx.userId}`)
        .order("criado_em", { ascending: false })
        .limit(8),
      supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", ctx.empresaId)
        .eq("lida", false)
        .or(`usuario_id.is.null,usuario_id.eq.${ctx.userId}`),
    ]);
    empresaNome = empresa?.nome ?? empresaNome;
    notificacoes = notificacoesData ?? [];
    naoLidas = count ?? 0;
    vencimento = empresa?.trial_expira_em ?? null;

    if (vencimento) {
      diasRestantes = Math.ceil(
        (new Date(vencimento).getTime() - new Date().getTime()) / 86_400_000
      );

      if (diasRestantes < 0 && !ctx.isSuperadmin) {
        return <AcessoBloqueado vencimento={vencimento} />;
      }
    }
  }

  return (
    <PermissionsProvider
      permissions={Array.from(ctx.permissions)}
      isSuperadmin={ctx.isSuperadmin}
      escopoDados={ctx.escopoDados}
    >
      <SidebarProvider>
        <AppSidebar empresaNome={empresaNome} cargoNome={ctx.cargoNome} />
        <SidebarInset>
          <AppHeader
            nome={ctx.nome}
            email={ctx.email}
            fotoUrl={ctx.fotoUrl}
            notificacoes={notificacoes}
            naoLidas={naoLidas}
            vencimento={vencimento}
            diasRestantes={diasRestantes}
          />
          <main className="flex-1 space-y-4 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PermissionsProvider>
  );
}
