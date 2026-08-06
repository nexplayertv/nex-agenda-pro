import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { LinkPublicoCard } from "@/components/catalogo/link-publico-card";

export default async function CatalogoPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const [{ data: empresa }, { data: config }, { count: servicosVisiveis }, { data: pix }] =
    await Promise.all([
      supabase.from("empresas").select("slug").eq("id", ctx.empresaId).single(),
      supabase
        .from("configuracoes_empresas")
        .select("catalogo_publico_ativo")
        .eq("empresa_id", ctx.empresaId)
        .single(),
      supabase
        .from("servicos")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", ctx.empresaId)
        .eq("status", "ativo")
        .eq("visivel_catalogo", true),
      supabase
        .from("gateways_empresas")
        .select("status")
        .eq("empresa_id", ctx.empresaId)
        .eq("tipo", "pix_proprio")
        .maybeSingle(),
    ]);

  if (!empresa || !config) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/agendar/${empresa.slug}`;
  const pixAtivo = pix?.status === "ativo";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo público"
        description="Personalize e compartilhe o link público de agendamento da sua empresa."
      />

      <LinkPublicoCard link={link} ativo={config.catalogo_publico_ativo} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            {(servicosVisiveis ?? 0) > 0 ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                {servicosVisiveis ?? 0} serviço(s) visível(is) no catálogo
              </p>
              <p className="text-xs text-muted-foreground">
                Gerencie em{" "}
                <Link href="/servicos" className="underline">
                  Serviços
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            {pixAtivo ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                {pixAtivo ? "Pagamento configurado" : "Nenhum pagamento configurado"}
              </p>
              <p className="text-xs text-muted-foreground">
                Gerencie em{" "}
                <Link href="/gateways" className="underline">
                  Gateways de pagamento
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
