import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
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
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>
          {user
            ? "Escolha uma nova senha para acessar o sistema."
            : "Este link de redefinição é inválido ou já expirou. Solicite um novo em \"Esqueci minha senha\"."}
        </CardDescription>
      </CardHeader>
      {user && (
        <CardContent>
          <RedefinirSenhaForm />
        </CardContent>
      )}
    </Card>
  );
}
