"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
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
import {
  salvarWhatsappSuporte,
  type ActionState,
} from "@/app/(superadmin)/configuracoes-plataforma/actions";

const initialState: ActionState = { error: null };

export function WhatsappSuporteForm({ whatsappAtual }: { whatsappAtual: string | null }) {
  const [state, formAction, pending] = useActionState(salvarWhatsappSuporte, initialState);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5" />
          <CardTitle>WhatsApp de suporte</CardTitle>
        </div>
        <CardDescription>
          Mostrado para empresas com acesso suspenso, como forma de entrar em contato.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número (com DDD)</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              defaultValue={whatsappAtual ?? ""}
              placeholder="(11) 90000-0000"
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.sucesso && !state.error && (
            <p className="text-sm text-emerald-600">Salvo.</p>
          )}
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
