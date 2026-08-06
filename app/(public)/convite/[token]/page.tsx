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
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { token } = await params;
  const { code } = await searchParams;

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

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
