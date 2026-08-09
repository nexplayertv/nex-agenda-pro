import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { GatewayPlataformaCard } from "@/components/gateways/gateway-plataforma-card";
import { WhatsappSuporteForm } from "@/components/superadmin/whatsapp-suporte-form";

export default async function ConfiguracoesPlataformaPage() {
  // credenciais_gateway_plataforma nao tem policy de RLS para authenticated
  // (proposital - ver 0024_gateway_plataforma.sql), entao a leitura precisa
  // da service role. A pagina em si so e alcancavel por superadmin (ver
  // app/(superadmin)/layout.tsx).
  const supabase = await createClient();
  const [{ data: gateways }, { data: config }] = await Promise.all([
    createServiceClient()
      .from("credenciais_gateway_plataforma")
      .select("tipo, status, ambiente, principal, dados_criptografados"),
    supabase.from("configuracoes_plataforma").select("whatsapp_suporte").eq("id", 1).single(),
  ]);

  const asaas = gateways?.find((g) => g.tipo === "asaas");
  const stripe = gateways?.find((g) => g.tipo === "stripe");
  const mercadopago = gateways?.find((g) => g.tipo === "mercadopago");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações da plataforma"
        description="Gateway usado para cobrar a mensalidade das empresas clientes. Só um pode ser o principal por vez."
      />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <GatewayPlataformaCard
          tipo="asaas"
          nome="Asaas"
          descricao="Pix, cartão de crédito e boleto via Asaas."
          status={asaas?.status ?? "nao_configurado"}
          ambiente={asaas?.ambiente ?? "producao"}
          principal={asaas?.principal ?? false}
          temCredencial={!!asaas?.dados_criptografados}
        />
        <GatewayPlataformaCard
          tipo="stripe"
          nome="Stripe"
          descricao="Cartão de crédito e outros métodos via Stripe."
          status={stripe?.status ?? "nao_configurado"}
          ambiente={stripe?.ambiente ?? "producao"}
          principal={stripe?.principal ?? false}
          temCredencial={!!stripe?.dados_criptografados}
        />
        <GatewayPlataformaCard
          tipo="mercadopago"
          nome="Mercado Pago"
          descricao="Pix confirmado automaticamente via Mercado Pago."
          status={mercadopago?.status ?? "nao_configurado"}
          ambiente={mercadopago?.ambiente ?? "producao"}
          principal={mercadopago?.principal ?? false}
          temCredencial={!!mercadopago?.dados_criptografados}
        />
      </div>

      <WhatsappSuporteForm whatsappAtual={config?.whatsapp_suporte ?? null} />
    </div>
  );
}
