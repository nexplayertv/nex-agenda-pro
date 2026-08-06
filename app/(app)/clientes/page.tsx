import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Can } from "@/hooks/use-permissions";
import { getAuthContext } from "@/lib/permissions/auth-context";
import { createClient } from "@/lib/supabase/server";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { ClientesTable, type ClienteLinha } from "@/components/clientes/clientes-table";

export default async function ClientesPage() {
  const ctx = await getAuthContext();
  let clientes: ClienteLinha[] = [];

  if (ctx?.empresaId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clientes")
      .select(
        "id, nome, whatsapp, email, data_nascimento, endereco, observacoes, preferencias, status, created_at"
      )
      .eq("empresa_id", ctx.empresaId)
      .order("nome");
    clientes = (data as ClienteLinha[] | null) ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro e histórico de cada cliente da sua empresa."
        actions={
          <Can recurso="clientes" acao="criar">
            <ClienteFormDialog
              trigger={
                <Button>
                  <UserPlus />
                  Novo cliente
                </Button>
              }
            />
          </Can>
        }
      />
      <ClientesTable clientes={clientes} />
    </div>
  );
}
