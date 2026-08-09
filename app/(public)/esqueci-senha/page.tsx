import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { EsqueciSenhaForm } from "./esqueci-senha-form";

export default async function EsqueciSenhaPage() {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("configuracoes_plataforma")
    .select("whatsapp_suporte")
    .eq("id", 1)
    .single();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Esqueci minha senha</CardTitle>
        <CardDescription>
          Informe seu e-mail para receber um link de redefinição de senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EsqueciSenhaForm whatsappSuporte={config?.whatsapp_suporte ?? null} />
      </CardContent>
    </Card>
  );
}
