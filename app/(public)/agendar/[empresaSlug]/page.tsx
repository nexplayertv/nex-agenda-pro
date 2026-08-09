import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { corContrastante } from "@/lib/utils-domain/cor";
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
          "descricao, endereco, telefone, whatsapp, redes_sociais, cor_primaria, logo_url, catalogo_publico_ativo, ocultar_valores_catalogo, percentual_entrada, politica_cancelamento"
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

  const corPrimaria = config?.cor_primaria || null;
  const estiloFundo = corPrimaria
    ? { backgroundColor: corPrimaria, color: corContrastante(corPrimaria) }
    : undefined;
  // Sobre um fundo customizado o "cinza apagado" do tema nao teria
  // contraste garantido - usamos a mesma cor de texto com opacidade.
  const classeTextoSecundario = corPrimaria ? "opacity-80" : "text-muted-foreground";

  const redesSociais = (config?.redes_sociais as { instagram?: string; facebook?: string } | null) ?? {};
  const linksContato = [
    config?.endereco
      ? {
          label: "Localização",
          icone: MapPin,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.endereco)}`,
        }
      : null,
    config?.whatsapp
      ? {
          label: "WhatsApp",
          icone: MessageCircle,
          href: `https://wa.me/55${config.whatsapp.replace(/\D/g, "")}`,
        }
      : null,
    redesSociais.instagram
      ? {
          label: "Instagram",
          icone: InstagramIcon,
          href: `https://instagram.com/${redesSociais.instagram.replace(/^@/, "")}`,
        }
      : null,
  ].filter((l): l is NonNullable<typeof l> => l !== null);

  return (
    <div className="min-h-screen w-full" style={estiloFundo}>
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <div className="text-center">
          {config?.logo_url && (
            <Image
              src={config.logo_url}
              alt={empresa.nome}
              width={64}
              height={64}
              priority
              className="mx-auto mb-2 size-16 rounded-full border object-cover"
            />
          )}
          <h1 className="text-2xl font-bold">{empresa.nome}</h1>
          {config?.descricao && (
            <p className={`text-sm ${classeTextoSecundario}`}>{config.descricao}</p>
          )}
          {config?.endereco && (
            <p className={`text-xs ${classeTextoSecundario}`}>{config.endereco}</p>
          )}

          {linksContato.length > 0 && (
            <div className="mt-3 flex justify-center gap-2">
              {linksContato.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={l.label}
                  className="flex size-9 items-center justify-center rounded-full border border-current opacity-90 transition-opacity hover:opacity-100"
                >
                  <l.icone className="size-4" />
                </a>
              ))}
            </div>
          )}
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
          <p className={`text-center text-xs ${classeTextoSecundario}`}>
            {config.politica_cancelamento}
          </p>
        )}

        <Button
          variant="outline"
          className="w-full bg-transparent"
          render={
            <Link href={`/agendar/${empresaSlug}/status`}>
              <Search />
              Já agendou? Consulte o status aqui
            </Link>
          }
        />
      </div>
    </div>
  );
}
