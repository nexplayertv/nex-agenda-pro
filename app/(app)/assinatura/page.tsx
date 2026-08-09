import { MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { whatsappLink } from "@/lib/mensagens/template";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/utils-domain/masks";
import { DocumentoForm } from "@/components/assinatura/documento-form";
import { RenovarAssinaturaButton } from "@/components/assinatura/renovar-button";

const STATUS_META: Record<string, { label: string; className: string }> = {
  trial: { label: "Período de teste", className: "bg-blue-500/15 text-blue-500" },
  ativa: { label: "Ativa", className: "bg-emerald-500/15 text-emerald-500" },
  pagamento_pendente: { label: "Pagamento pendente", className: "bg-amber-500/15 text-amber-500" },
  vencida: { label: "Vencida", className: "bg-destructive/15 text-destructive" },
  suspensa: { label: "Suspensa", className: "bg-destructive/15 text-destructive" },
  cancelada: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

export default async function AssinaturaPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const [{ data: empresa }, { data: plano }, { data: ciclos }] = await Promise.all([
    supabase
      .from("empresas")
      .select("status_assinatura, trial_expira_em, cnpj_cpf, nome_completo, ativa")
      .eq("id", ctx.empresaId)
      .single(),
    supabase.from("planos_saas").select("nome").eq("ativo", true).single(),
    supabase
      .from("ciclos_cobranca_saas")
      .select("id, nome, periodo_dias, valor")
      .eq("ativo", true)
      .order("periodo_dias", { ascending: true }),
  ]);

  const vencimento = empresa?.trial_expira_em ? new Date(empresa.trial_expira_em) : null;
  const diasRestantes = vencimento
    ? Math.ceil((vencimento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const statusMeta = empresa ? STATUS_META[empresa.status_assinatura] : undefined;

  if (empresa && !empresa.ativa) {
    const { data: config } = await supabase
      .from("configuracoes_plataforma")
      .select("whatsapp_suporte")
      .eq("id", 1)
      .single();

    return (
      <div className="space-y-4">
        <PageHeader
          title="Plano e renovação"
          description="Detalhes da sua assinatura AgendaPro e status de pagamento."
        />
        <Card>
          <CardContent className="space-y-4 py-6 text-center">
            <Badge className="bg-destructive/15 text-destructive">Acesso suspenso</Badge>
            <p className="text-sm text-muted-foreground">
              O acesso da sua empresa foi suspenso pelo administrador da plataforma. Renovar o
              pagamento não reativa sozinho — entre em contato com o suporte para mais
              informações.
            </p>
            {config?.whatsapp_suporte && (
              <Button
                render={
                  <a
                    href={whatsappLink(
                      config.whatsapp_suporte,
                      "Olá! Meu acesso ao AgendaPro foi suspenso e preciso de ajuda."
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle />
                    Falar com o suporte
                  </a>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Plano e renovação"
        description="Detalhes da sua assinatura AgendaPro e status de pagamento."
      />

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Plano atual</p>
              <p className="text-lg font-semibold">{plano?.nome ?? "—"}</p>
            </div>
            {statusMeta && <Badge className={statusMeta.className}>{statusMeta.label}</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Vencimento</p>
              <p className="font-medium">{vencimento ? formatarData(vencimento) : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dias restantes</p>
              <p className="font-medium">
                {diasRestantes === null
                  ? "—"
                  : diasRestantes < 0
                    ? "Vencido"
                    : `${diasRestantes} dia(s)`}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Escolha o período abaixo — a renovação garante os dias correspondentes de acesso ao
            painel a partir da confirmação do pagamento. Você pode renovar a qualquer momento,
            mesmo antes do vencimento.
          </p>

          <DocumentoForm
            nomeCompleto={empresa?.nome_completo ?? null}
            cnpjCpf={empresa?.cnpj_cpf ?? null}
          />

          <RenovarAssinaturaButton
            ciclos={(ciclos ?? []).map((c) => ({ ...c, valor: Number(c.valor) }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
