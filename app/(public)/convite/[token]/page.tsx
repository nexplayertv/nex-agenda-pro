import { createClient } from "@/lib/supabase/server";
import { DefinirSenhaForm } from "./definir-senha-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // A troca do "code" pela sessao ja aconteceu no proxy.ts (precisa ser
  // la, e nao aqui, pra persistir o cookie de sessao corretamente).
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Bem-vindo(a)!</CardTitle>
        <CardDescription>
          {user
            ? "Defina uma senha para acessar o sistema."
            : "Este link de convite é inválido ou já expirou. Peça ao administrador para reenviar o convite."}
        </CardDescription>
      </CardHeader>
      {user && (
        <CardContent>
          <DefinirSenhaForm token={token} />
        </CardContent>
      )}
    </Card>
  );
}
