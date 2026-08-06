import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { NotificacoesLista } from "@/components/notificacoes/notificacoes-lista";

export default async function NotificacoesPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("notificacoes")
    .select("id, titulo, mensagem, lida, link, criado_em")
    .eq("empresa_id", ctx.empresaId)
    .or(`usuario_id.is.null,usuario_id.eq.${ctx.userId}`)
    .order("criado_em", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <PageHeader title="Notificações" description="Histórico de notificações da sua empresa." />
      <NotificacoesLista notificacoes={data ?? []} />
    </div>
  );
}
