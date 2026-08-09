import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { AparenciaForm } from "@/components/configuracoes/aparencia-form";
import { CatalogoForm } from "@/components/configuracoes/catalogo-form";
import { NegocioForm } from "@/components/configuracoes/negocio-form";
import { PagamentoForm } from "@/components/configuracoes/pagamento-form";

export default async function ConfiguracoesPage() {
  const ctx = await getAuthContext();

  if (!ctx?.empresaId) {
    return null;
  }

  const supabase = await createClient();
  const [{ data: empresa }, { data: config }] = await Promise.all([
    supabase.from("empresas").select("nome, segmento").eq("id", ctx.empresaId).single(),
    supabase
      .from("configuracoes_empresas")
      .select("*")
      .eq("empresa_id", ctx.empresaId)
      .single(),
  ]);

  if (!empresa || !config) return null;

  const redesSociais = (config.redes_sociais ?? {}) as { instagram?: string; facebook?: string };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Branding, percentual de entrada, política de cancelamento e mais."
      />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="negocio">
            <TabsList>
              <TabsTrigger value="negocio">Negócio</TabsTrigger>
              <TabsTrigger value="aparencia">Aparência</TabsTrigger>
              <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
              <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
            </TabsList>

            <TabsContent value="negocio" className="pt-4">
              <NegocioForm
                nome={empresa.nome}
                segmento={empresa.segmento}
                descricao={config.descricao}
                telefone={config.telefone}
                whatsapp={config.whatsapp}
                email={config.email}
                endereco={config.endereco}
                instagram={redesSociais.instagram ?? null}
                facebook={redesSociais.facebook ?? null}
                exibirLocalizacao={config.exibir_localizacao}
                exibirWhatsappPublico={config.exibir_whatsapp_publico}
                exibirInstagram={config.exibir_instagram}
              />
            </TabsContent>

            <TabsContent value="aparencia" className="pt-4">
              <AparenciaForm
                logoUrl={config.logo_url}
                corPrimaria={config.cor_primaria}
                corSecundaria={config.cor_secundaria}
              />
            </TabsContent>

            <TabsContent value="pagamento" className="pt-4">
              <PagamentoForm
                percentualEntrada={config.percentual_entrada}
                prazoReservaMinutos={config.prazo_reserva_minutos}
                prazoComprovanteMinutos={config.prazo_comprovante_minutos}
                prazoAnaliseComprovanteMinutos={config.prazo_analise_comprovante_minutos}
                politicaCancelamento={config.politica_cancelamento}
              />
            </TabsContent>

            <TabsContent value="catalogo" className="pt-4">
              <CatalogoForm
                catalogoPublicoAtivo={config.catalogo_publico_ativo}
                ocultarValoresCatalogo={config.ocultar_valores_catalogo}
                moeda={config.moeda}
                fusoHorario={config.fuso_horario}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
