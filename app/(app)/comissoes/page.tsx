import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Can } from "@/hooks/use-permissions";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";
import { marcarComissaoPaga } from "./actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pendente: "outline",
  disponivel: "secondary",
  pago: "default",
  cancelado: "destructive",
  estornado: "destructive",
};

export default async function ComissoesPage() {
  const ctx = await getAuthContext();
  if (!ctx?.empresaId) return null;

  const supabase = await createClient();
  let query = supabase
    .from("comissoes")
    .select(
      "id, valor, percentual, status, data_disponivel, data_pagamento, profissionais(nome), agendamentos(data, servicos(nome))"
    )
    .eq("empresa_id", ctx.empresaId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (ctx.escopoDados === "proprio" && ctx.profissionalId) {
    query = query.eq("profissional_id", ctx.profissionalId);
  }

  const { data } = await query;
  const comissoes = data ?? [];
  const totalPendente = comissoes
    .filter((c) => c.status === "disponivel")
    .reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões"
        description="Cálculo e status de comissões por profissional e atendimento."
      />

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total disponível para pagamento</p>
        <p className="text-2xl font-bold">{formatarMoeda(totalPendente)}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {comissoes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma comissão registrada ainda.
                </TableCell>
              </TableRow>
            )}
            {comissoes.map((c) => {
              const agendamento = c.agendamentos as unknown as {
                data: string;
                servicos: { nome: string } | null;
              } | null;
              const profissional = c.profissionais as unknown as { nome: string } | null;
              return (
                <TableRow key={c.id}>
                  <TableCell>{profissional?.nome ?? "—"}</TableCell>
                  <TableCell>{agendamento?.servicos?.nome ?? "—"}</TableCell>
                  <TableCell>{agendamento ? formatarData(agendamento.data) : "—"}</TableCell>
                  <TableCell>{formatarMoeda(Number(c.valor))}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.status === "disponivel" && (
                      <Can recurso="comissoes" acao="aprovar">
                        <form action={async () => { "use server"; await marcarComissaoPaga(c.id); }}>
                          <Button type="submit" size="sm" variant="outline">
                            Marcar pago
                          </Button>
                        </form>
                      </Can>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
