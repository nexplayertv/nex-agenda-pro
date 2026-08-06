import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { GatewayAutomaticoCard } from "@/components/gateways/gateway-automatico-card";
import { PixProprioCard } from "@/components/gateways/pix-proprio-card";

export default async function GatewaysPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const [{ data: gateways }, { data: chavePix }] = await Promise.all([
    supabase
      .from("gateways_empresas")
      .select("tipo, status, ambiente, principal, id")
      .eq("empresa_id", ctx.empresaId),
    supabase.from("chaves_pix").select("*").eq("empresa_id", ctx.empresaId).maybeSingle(),
  ]);

  const gatewayIds = (gateways ?? []).map((g) => g.id);
  const { data: credenciais } =
    gatewayIds.length > 0
      ? await supabase
          .from("credenciais_gateways")
          .select("gateway_empresa_id")
          .in("gateway_empresa_id", gatewayIds)
      : { data: [] };

  const credenciaisSet = new Set((credenciais ?? []).map((c) => c.gateway_empresa_id));

  const pix = gateways?.find((g) => g.tipo === "pix_proprio");
  const asaas = gateways?.find((g) => g.tipo === "asaas");
  const stripe = gateways?.find((g) => g.tipo === "stripe");
  const mercadopago = gateways?.find((g) => g.tipo === "mercadopago");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gateways de pagamento"
        description="Configure como sua empresa recebe o pagamento da entrada. No máximo um gateway automático (Asaas, Stripe ou Mercado Pago) pode ser o principal."
      />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <GatewayAutomaticoCard
          tipo="mercadopago"
          nome="Mercado Pago"
          descricao="Pix confirmado automaticamente via Mercado Pago."
          status={mercadopago?.status ?? "nao_configurado"}
          ambiente={mercadopago?.ambiente ?? "sandbox"}
          principal={mercadopago?.principal ?? false}
          temCredencial={mercadopago ? credenciaisSet.has(mercadopago.id) : false}
        />
        <GatewayAutomaticoCard
          tipo="asaas"
          nome="Asaas"
          descricao="Pix, cartão de crédito e boleto via Asaas."
          status={asaas?.status ?? "nao_configurado"}
          ambiente={asaas?.ambiente ?? "sandbox"}
          principal={asaas?.principal ?? false}
          temCredencial={asaas ? credenciaisSet.has(asaas.id) : false}
        />
        <GatewayAutomaticoCard
          tipo="stripe"
          nome="Stripe"
          descricao="Cartão de crédito e outros métodos via Stripe Connect."
          status={stripe?.status ?? "nao_configurado"}
          ambiente={stripe?.ambiente ?? "sandbox"}
          principal={stripe?.principal ?? false}
          temCredencial={stripe ? credenciaisSet.has(stripe.id) : false}
        />
        <PixProprioCard status={pix?.status ?? "nao_configurado"} chave={chavePix ?? null} />
      </div>
    </div>
  );
}
