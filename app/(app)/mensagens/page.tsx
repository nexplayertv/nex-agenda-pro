import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { TemplateItem } from "@/components/mensagens/template-item";

const TITULOS: Record<string, string> = {
  confirmacao_agendamento: "Confirmação do agendamento",
  pagamento_aguardando: "Pagamento aguardando",
  pagamento_confirmado: "Pagamento confirmado",
  comprovante_recebido: "Comprovante recebido",
  comprovante_recusado: "Comprovante recusado",
  lembrete_dia_anterior: "Lembrete do dia anterior",
  lembrete_mesmo_dia: "Lembrete no mesmo dia",
  reagendamento: "Reagendamento",
  cancelamento: "Cancelamento",
  agradecimento: "Agradecimento",
  solicitacao_avaliacao: "Solicitação de avaliação",
  nao_compareceu: "Cliente que não compareceu",
  valor_restante_pendente: "Valor restante pendente",
};

export default async function MensagensPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates_mensagens")
    .select("id, tipo, conteudo")
    .eq("empresa_id", ctx.empresaId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensagens e templates"
        description="Textos usados no envio de mensagens pelo WhatsApp. Use variáveis como {nome_cliente}, {servico}, {data} e {horario}."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {(templates ?? []).map((t) => (
          <TemplateItem key={t.id} id={t.id} titulo={TITULOS[t.tipo] ?? t.tipo} conteudo={t.conteudo} />
        ))}
      </div>
    </div>
  );
}
