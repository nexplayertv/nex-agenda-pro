import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/utils-domain/masks";
import { EmpresaAcoes } from "@/components/superadmin/empresa-acoes";

type EmpresaLinha = {
  id: string;
  nome: string;
  slug: string;
  segmento: string;
  status_assinatura: string;
  trial_expira_em: string | null;
  ativa: boolean;
  created_at: string;
  planos_saas: { nome: string } | null;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  trial: { label: "Trial", className: "bg-blue-500/15 text-blue-500" },
  ativa: { label: "Ativa", className: "bg-emerald-500/15 text-emerald-500" },
  pagamento_pendente: { label: "Pagamento pendente", className: "bg-amber-500/15 text-amber-500" },
  vencida: { label: "Vencida", className: "bg-destructive/15 text-destructive" },
  suspensa: { label: "Suspensa", className: "bg-destructive/15 text-destructive" },
  cancelada: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

export default async function EmpresasSuperadminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("empresas")
    .select(
      "id, nome, slug, segmento, status_assinatura, trial_expira_em, ativa, created_at, planos_saas(nome)"
    )
    .order("created_at", { ascending: false });

  const empresas = (data as unknown as EmpresaLinha[] | null) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Empresas"
        description="Todas as empresas cadastradas na plataforma, status da assinatura e acesso."
      />

      {empresas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma empresa cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Cadastrada em</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa) => {
                const statusMeta = STATUS_META[empresa.status_assinatura];
                return (
                  <TableRow key={empresa.id}>
                    <TableCell>
                      <p className="font-medium">{empresa.nome}</p>
                      <p className="text-xs text-muted-foreground">{empresa.slug}</p>
                    </TableCell>
                    <TableCell className="capitalize">{empresa.segmento}</TableCell>
                    <TableCell>{empresa.planos_saas?.nome ?? "—"}</TableCell>
                    <TableCell>
                      {statusMeta ? (
                        <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                      ) : (
                        empresa.status_assinatura
                      )}
                    </TableCell>
                    <TableCell>
                      {empresa.trial_expira_em ? formatarData(empresa.trial_expira_em) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={empresa.ativa ? "default" : "secondary"}>
                        {empresa.ativa ? "Liberado" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatarData(empresa.created_at)}</TableCell>
                    <TableCell>
                      <EmpresaAcoes
                        empresaId={empresa.id}
                        nome={empresa.nome}
                        ativa={empresa.ativa}
                        vencimentoAtual={empresa.trial_expira_em}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
