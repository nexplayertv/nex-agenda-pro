import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Can } from "@/hooks/use-permissions";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { AgendaToolbar } from "@/components/agenda/agenda-toolbar";
import { AgendaView } from "@/components/agenda/agenda-view";
import { MensagensHojeDialog } from "@/components/agenda/mensagens-hoje-dialog";
import type { AgendamentoAgenda } from "@/components/agenda/types";

const SELECT_AGENDAMENTO = `
  id, data, hora_inicio, hora_fim, status, valor_total, valor_entrada, valor_restante,
  forma_pagamento, observacoes,
  clientes(id, nome, whatsapp, foto_url),
  profissionais(id, nome, cor_agenda),
  servicos(id, nome, duracao_minutos)
`;

function addDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; data?: string; profissionalId?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const view = (params.view as "dia" | "semana" | "mes" | "lista") ?? "dia";
  const data = params.data ?? new Date().toISOString().slice(0, 10);
  const profissionalId = params.profissionalId ?? "";
  const hoje = new Date().toISOString().slice(0, 10);

  const supabase = await createClient();

  let dataInicio = data;
  let dataFim = data;
  if (view === "semana") {
    const inicioSemana = new Date(`${data}T00:00:00`);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    dataInicio = inicioSemana.toISOString().slice(0, 10);
    dataFim = addDias(dataInicio, 6);
  } else if (view === "mes") {
    const d = new Date(`${data}T00:00:00`);
    dataInicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    dataFim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  } else if (view === "lista") {
    dataFim = addDias(data, 30);
  }

  let query = supabase
    .from("agendamentos")
    .select(SELECT_AGENDAMENTO)
    .eq("empresa_id", ctx.empresaId)
    .gte("data", dataInicio)
    .lte("data", dataFim)
    .order("data")
    .order("hora_inicio");

  if (profissionalId) query = query.eq("profissional_id", profissionalId);

  const [{ data: agendamentosData }, { data: profissionais }, { data: empresa }, { data: config }] =
    await Promise.all([
      query,
      supabase
        .from("profissionais")
        .select("id, nome")
        .eq("empresa_id", ctx.empresaId)
        .eq("status", "ativo")
        .order("nome"),
      supabase.from("empresas").select("nome").eq("id", ctx.empresaId).single(),
      supabase
        .from("configuracoes_empresas")
        .select("whatsapp, endereco")
        .eq("empresa_id", ctx.empresaId)
        .single(),
    ]);

  const agendamentos = (agendamentosData as unknown as AgendamentoAgenda[] | null) ?? [];

  let agendamentosHoje: AgendamentoAgenda[] = [];
  let templates: { id: string; tipo: string; conteudo: string }[] = [];

  if (data === hoje) {
    agendamentosHoje = agendamentos.filter(
      (a) => a.data === hoje && !["cancelado", "reagendado"].includes(a.status)
    );
  } else {
    const { data: agHoje } = await supabase
      .from("agendamentos")
      .select(SELECT_AGENDAMENTO)
      .eq("empresa_id", ctx.empresaId)
      .eq("data", hoje)
      .not("status", "in", "(cancelado,reagendado)");
    agendamentosHoje = (agHoje as unknown as AgendamentoAgenda[] | null) ?? [];
  }

  const { data: templatesData } = await supabase
    .from("templates_mensagens")
    .select("id, tipo, conteudo")
    .eq("empresa_id", ctx.empresaId)
    .in("tipo", ["confirmacao_agendamento", "lembrete_mesmo_dia", "valor_restante_pendente", "agradecimento"]);
  templates = templatesData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Todos os agendamentos da sua empresa, por dia, semana, mês ou lista."
        actions={
          <div className="flex gap-2">
            <MensagensHojeDialog
              agendamentosHoje={agendamentosHoje}
              templates={templates}
              empresaNome={empresa?.nome ?? ""}
              empresaWhatsapp={config?.whatsapp ?? null}
              empresaEndereco={config?.endereco ?? null}
            />
            <Can recurso="agendamentos" acao="criar">
              <Button render={
                <Link href="/agendamentos/novo">
                  <CalendarPlus />
                  Novo agendamento
                </Link>
              } />
            </Can>
          </div>
        }
      />

      <AgendaToolbar
        view={view}
        data={data}
        profissionais={profissionais ?? []}
        profissionalId={profissionalId}
      />

      <AgendaView
        view={view}
        data={data}
        agendamentos={agendamentos}
        profissionais={profissionais ?? []}
      />
    </div>
  );
}
