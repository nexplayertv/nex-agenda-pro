"use client";

import { useActionState, useState, useTransition } from "react";
import { CreditCard, Unplug } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GatewayStatusBadge } from "./gateway-status-badge";
import {
  definirGatewayPrincipal,
  desconectarGateway,
  salvarCredencialGateway,
  testarConexaoGateway,
  type ActionState,
} from "@/app/(app)/gateways/actions";

const initialState: ActionState = { error: null };

export function GatewayAutomaticoCard({
  tipo,
  nome,
  descricao,
  status,
  ambiente,
  principal,
  temCredencial,
}: {
  tipo: "asaas" | "stripe";
  nome: string;
  descricao: string;
  status: string;
  ambiente: string;
  principal: boolean;
  temCredencial: boolean;
}) {
  const salvar = salvarCredencialGateway.bind(null, tipo);
  const [state, formAction, pending] = useActionState(salvar, initialState);
  const [, startTransition] = useTransition();
  const [testeMensagem, setTesteMensagem] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5" />
            <CardTitle>{nome}</CardTitle>
          </div>
          <GatewayStatusBadge status={status} />
        </div>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {principal && <p className="text-xs font-medium text-primary">Gateway principal ativo</p>}

        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select
              items={{ sandbox: "Sandbox", producao: "Produção" }}
              name="ambiente"
              defaultValue={ambiente}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`apiKey-${tipo}`}>
              {tipo === "asaas" ? "Chave de API (access_token)" : "Chave secreta (sk_...)"}
            </Label>
            <Input id={`apiKey-${tipo}`} name="apiKey" type="password" placeholder="••••••••" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.sucesso && !state.error && (
            <p className="text-sm text-emerald-600">Credenciais salvas.</p>
          )}
          <Button type="submit" disabled={pending} variant="outline" className="w-full">
            {pending ? "Salvando..." : "Conectar / atualizar chave"}
          </Button>
        </form>

        {temCredencial && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                startTransition(async () => {
                  const r = await testarConexaoGateway(tipo);
                  setTesteMensagem(r.mensagem);
                })
              }
            >
              Testar conexão
            </Button>
            {!principal && (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    await definirGatewayPrincipal(tipo);
                  })
                }
              >
                Tornar principal
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => startTransition(() => desconectarGateway(tipo))}
            >
              <Unplug />
              Desconectar
            </Button>
          </div>
        )}
        {testeMensagem && <p className="text-xs text-muted-foreground">{testeMensagem}</p>}
      </CardContent>
    </Card>
  );
}
