"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { whatsappLink } from "@/lib/mensagens/template";
import { solicitarRedefinicao, type EsqueciSenhaState } from "./actions";

const initialState: EsqueciSenhaState = { error: null, sucesso: false };

export function EsqueciSenhaForm({ whatsappSuporte }: { whatsappSuporte: string | null }) {
  const [state, action, pending] = useActionState(solicitarRedefinicao, initialState);

  return (
    <>
      {state.sucesso ? (
        <div className="space-y-4">
          <p className="text-sm">
            Se esse e-mail estiver cadastrado, você vai receber um link de redefinição em
            instantes. O e-mail pode demorar alguns minutos ou cair na caixa de spam.
          </p>
          {whatsappSuporte && (
            <div className="space-y-2 rounded-lg border p-3 text-center">
              <p className="text-sm text-muted-foreground">Não recebeu ou precisa de ajuda?</p>
              <Button
                variant="outline"
                className="w-full"
                render={
                  <a
                    href={whatsappLink(
                      whatsappSuporte,
                      "Olá! Estou tentando redefinir minha senha do AgendaPro e preciso de ajuda."
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle />
                    Falar com o suporte
                  </a>
                }
              />
            </div>
          )}
        </div>
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
    </>
  );
}
