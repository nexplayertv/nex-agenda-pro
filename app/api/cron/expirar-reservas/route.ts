import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Chamado periodicamente (ver docs/setup.md - Vercel Cron, GitHub Actions
// ou pg_cron chamando este endpoint) para liberar reservas temporarias
// vencidas. Protegido por CRON_SECRET no header Authorization.

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const agora = new Date().toISOString();

  const { data: expiradas } = await supabase
    .from("reservas_temporarias")
    .select("id, agendamento_id, empresa_id")
    .eq("status", "ativa")
    .lt("expira_em", agora);

  for (const reserva of expiradas ?? []) {
    // Sequencial de proposito - ver nota em pagamentos-entrada/actions.ts
    // sobre escritas concorrentes na mesma instancia do client se perdendo.
    await supabase.from("reservas_temporarias").update({ status: "expirada" }).eq("id", reserva.id);
    await supabase
      .from("agendamentos")
      .update({
        status: "cancelado",
        cancelado_em: agora,
        cancelado_motivo: "Prazo de pagamento expirado",
      })
      .eq("id", reserva.agendamento_id);
    await supabase
      .from("pagamentos")
      .update({ status: "expirado" })
      .eq("agendamento_id", reserva.agendamento_id)
      .eq("status", "pendente");
    await supabase.from("notificacoes").insert({
      empresa_id: reserva.empresa_id,
      tipo: "pagamento_expirado",
      titulo: "Reserva expirada",
      mensagem: "Uma reserva temporária expirou sem pagamento e o horário foi liberado.",
      link: "/agenda",
    });
  }

  return NextResponse.json({ expiradas: expiradas?.length ?? 0 });
}
