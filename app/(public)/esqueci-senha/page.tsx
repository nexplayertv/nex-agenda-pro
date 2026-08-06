"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { solicitarRedefinicao, type EsqueciSenhaState } from "./actions";

const initialState: EsqueciSenhaState = { error: null, sucesso: false };

export default function EsqueciSenhaPage() {
  const [state, action, pending] = useActionState(solicitarRedefinicao, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Esqueci minha senha</CardTitle>
        <CardDescription>
          Informe seu e-mail para receber um link de redefinição de senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.sucesso ? (
          <p className="text-sm">
            Se esse e-mail estiver cadastrado, você vai receber um link de redefinição em
            instantes.
          </p>
        ) : (
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        )}
        <div className="pt-4 text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:underline">
            Voltar para o login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
