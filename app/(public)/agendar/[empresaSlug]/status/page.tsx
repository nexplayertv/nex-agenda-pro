import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { ConsultaStatusForm } from "@/components/booking/consulta-status-form";

export default async function StatusAgendamentoPage({
  params,
}: {
  params: Promise<{ empresaSlug: string }>;
}) {
  const { empresaSlug } = await params;
  const supabase = createServiceClient();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome, ativa")
    .eq("slug", empresaSlug)
    .single();

  if (!empresa || !empresa.ativa) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{empresa.nome}</h1>
        <p className="text-sm text-muted-foreground">Consultar status do agendamento</p>
      </div>

      <ConsultaStatusForm empresaSlug={empresaSlug} />

      <div className="text-center">
        <Link
          href={`/agendar/${empresaSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Voltar para agendamento
        </Link>
      </div>
    </div>
  );
}
