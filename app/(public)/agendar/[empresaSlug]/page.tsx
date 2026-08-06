import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/service";
import { BookingFlow } from "@/components/booking/booking-flow";

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ empresaSlug: string }>;
}) {
  const { empresaSlug } = await params;
  const supabase = createServiceClient();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, nome, ativa")
    .eq("slug", empresaSlug)
    .single();

  if (!empresa || !empresa.ativa) notFound();

  const [{ data: config }, { data: servicos }, { data: gatewayPix }, { data: chavePix }, { data: gatewayAutomatico }] =
    await Promise.all([
      supabase
        .from("configuracoes_empresas")
        .select(
          "descricao, endereco, telefone, whatsapp, cor_primaria, catalogo_publico_ativo, ocultar_valores_catalogo, percentual_entrada, politica_cancelamento"
        )
        .eq("empresa_id", empresa.id)
        .single(),
      supabase
        .from("servicos")
        .select("id, nome, descricao, valor, duracao_minutos, profissionais_servicos(profissional_id, profissionais(id, nome, foto_url, biografia, status))")
        .eq("empresa_id", empresa.id)
        .eq("status", "ativo")
        .eq("visivel_catalogo", true)
        .order("ordem"),
      supabase
        .from("gateways_empresas")
        .select("status")
        .eq("empresa_id", empresa.id)
        .eq("tipo", "pix_proprio")
        .maybeSingle(),
      supabase
        .from("chaves_pix")
        .select("chave, nome_titular, nome_banco, cidade_recebedor")
        .eq("empresa_id", empresa.id)
        .eq("status", "ativo")
        .maybeSingle(),
      // So um gateway automatico pode ser "principal" por vez (regra
      // aplicada em app/(app)/gateways/actions.ts) - se houver um ativo,
      // ele tem prioridade sobre o Pix proprio no checkout do cliente.
      supabase
        .from("gateways_empresas")
        .select("tipo")
        .eq("empresa_id", empresa.id)
        .eq("principal", true)
        .eq("status", "ativo")
        .in("tipo", ["asaas", "stripe", "mercadopago"])
        .maybeSingle(),
    ]);

  if (!config?.catalogo_publico_ativo) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-lg font-medium">Agendamento indisponível no momento.</p>
      </div>
    );
  }

  const servicosFormatados = (servicos ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    valor: Number(s.valor),
    duracao_minutos: s.duracao_minutos,
    ocultar_valor: config.ocultar_valores_catalogo,
  }));

  const profissionaisPorServico: Record<string, { id: string; nome: string; foto_url: string | null; biografia: string | null }[]> = {};
  for (const s of servicos ?? []) {
    const vinculos = s.profissionais_servicos as unknown as {
      profissionais: { id: string; nome: string; foto_url: string | null; biografia: string | null; status: string } | null;
    }[];
    profissionaisPorServico[s.id] = (vinculos ?? [])
      .map((v) => v.profissionais)
      .filter((p): p is NonNullable<typeof p> => !!p && p.status === "ativo");
  }

  const usarGatewayAutomatico = !!gatewayAutomatico;
  const pixAtivo = !usarGatewayAutomatico && gatewayPix?.status === "ativo" && !!chavePix;
  const pagamentoDisponivel = usarGatewayAutomatico || pixAtivo;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{empresa.nome}</h1>
        {config?.descricao && <p className="text-sm text-muted-foreground">{config.descricao}</p>}
        {config?.endereco && <p className="text-xs text-muted-foreground">{config.endereco}</p>}
      </div>

      {!pagamentoDisponivel && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma forma de pagamento está configurada no momento. Entre em contato com{" "}
            {empresa.nome} para agendar.
          </CardContent>
        </Card>
      )}

      {pagamentoDisponivel && servicosFormatados.length > 0 && (
        <BookingFlow
          empresaId={empresa.id}
          empresaSlug={empresaSlug}
          empresaNome={empresa.nome}
          servicos={servicosFormatados}
          profissionaisPorServico={profissionaisPorServico}
          percentualEntrada={config.percentual_entrada}
          gatewayAutomaticoTipo={usarGatewayAutomatico ? gatewayAutomatico!.tipo : null}
          chavePix={
            pixAtivo
              ? {
                  chave: chavePix!.chave,
                  nomeTitular: chavePix!.nome_titular,
                  nomeBanco: chavePix!.nome_banco,
                  cidade: chavePix!.cidade_recebedor,
                }
              : null
          }
        />
      )}

      {pagamentoDisponivel && servicosFormatados.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Nenhum serviço disponível para agendamento no momento.
          </CardContent>
        </Card>
      )}

      {config?.politica_cancelamento && (
        <p className="text-center text-xs text-muted-foreground">
          {config.politica_cancelamento}
        </p>
      )}

      <div className="text-center">
        <Link
          href={`/agendar/${empresaSlug}/status`}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Já agendou? Consulte o status aqui
        </Link>
      </div>
    </div>
  );
}
