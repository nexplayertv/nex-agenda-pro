import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Gera os horarios de inicio possiveis (em passos de 15min) para um
 * profissional atender um servico de `duracaoMinutos` em `data`,
 * considerando expediente, intervalos, folgas, ferias, bloqueios e
 * agendamentos ja existentes. E a mesma logica usada pelo admin (agenda
 * manual) e pelo link publico, para nunca divergir.
 */
export async function getSlotsDisponiveis(
  supabase: SupabaseClient,
  params: {
    empresaId: string;
    profissionalId: string;
    data: string; // YYYY-MM-DD
    duracaoMinutos: number;
  }
): Promise<string[]> {
  const { empresaId, profissionalId, data, duracaoMinutos } = params;
  const diaSemana = new Date(`${data}T00:00:00`).getDay();

  const [
    { data: horarios },
    { data: intervalos },
    { data: folgas },
    { data: ferias },
    { data: bloqueios },
    { data: agendamentos },
  ] = await Promise.all([
    supabase
      .from("horarios_funcionamento")
      .select("hora_inicio, hora_fim")
      .eq("empresa_id", empresaId)
      .eq("profissional_id", profissionalId)
      .eq("dia_semana", diaSemana),
    supabase
      .from("intervalos")
      .select("hora_inicio, hora_fim")
      .eq("empresa_id", empresaId)
      .eq("profissional_id", profissionalId)
      .eq("dia_semana", diaSemana),
    supabase
      .from("folgas")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("profissional_id", profissionalId)
      .eq("data", data),
    supabase
      .from("ferias")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("profissional_id", profissionalId)
      .lte("data_inicio", data)
      .gte("data_fim", data),
    supabase
      .from("bloqueios_agenda")
      .select("data_inicio, data_fim")
      .eq("empresa_id", empresaId)
      .or(`profissional_id.eq.${profissionalId},profissional_id.is.null`)
      .lte("data_inicio", `${data}T23:59:59`)
      .gte("data_fim", `${data}T00:00:00`),
    supabase
      .from("agendamentos")
      .select("hora_inicio, hora_fim")
      .eq("empresa_id", empresaId)
      .eq("profissional_id", profissionalId)
      .eq("data", data)
      .not("status", "in", "(cancelado,reembolsado,reagendado)"),
  ]);

  if ((folgas?.length ?? 0) > 0 || (ferias?.length ?? 0) > 0 || !horarios?.length) {
    return [];
  }

  const ocupados: { inicio: number; fim: number }[] = [];

  for (const i of intervalos ?? []) {
    ocupados.push({ inicio: paraMinutos(i.hora_inicio), fim: paraMinutos(i.hora_fim) });
  }
  for (const b of bloqueios ?? []) {
    const inicioDia = new Date(`${data}T00:00:00`).getTime();
    const inicio = Math.max(0, Math.round((new Date(b.data_inicio).getTime() - inicioDia) / 60000));
    const fim = Math.min(
      24 * 60,
      Math.round((new Date(b.data_fim).getTime() - inicioDia) / 60000)
    );
    ocupados.push({ inicio, fim });
  }
  for (const a of agendamentos ?? []) {
    ocupados.push({ inicio: paraMinutos(a.hora_inicio), fim: paraMinutos(a.hora_fim) });
  }

  const slots: string[] = [];
  const passo = 15;
  const agora = new Date();
  const ehHoje = data === agora.toISOString().slice(0, 10);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  for (const janela of horarios) {
    const inicioJanela = paraMinutos(janela.hora_inicio);
    const fimJanela = paraMinutos(janela.hora_fim);

    for (let inicio = inicioJanela; inicio + duracaoMinutos <= fimJanela; inicio += passo) {
      const fim = inicio + duracaoMinutos;
      if (ehHoje && inicio <= minutosAgora) continue;

      const conflita = ocupados.some((o) => inicio < o.fim && fim > o.inicio);
      if (!conflita) slots.push(paraHora(inicio));
    }
  }

  return slots;
}
