import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export default async function RedefinirSenhaPage() {
  // A troca do "code" pela sessao ja aconteceu no proxy.ts (precisa ser
  // la, e nao aqui, pra persistir o cookie de sessao corretamente).
  const supabase = await createClient();

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
