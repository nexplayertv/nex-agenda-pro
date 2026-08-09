"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Copy, CreditCard, Unplug } from "lucide-react";
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
  definirGatewayPrincipalPlataforma,
  desconectarGatewayPlataforma,
  salvarCredencialGatewayPlataforma,
  testarConexaoGatewayPlataforma,
  type ActionState,
  type GatewayPlataformaTipo,
} from "@/app/(superadmin)/configuracoes-plataforma/actions";

const initialState: ActionState = { error: null };

const LABEL_CHAVE: Record<GatewayPlataformaTipo, string> = {
  asaas: "Chave de API (access_token)",
  stripe: "Chave secreta (sk_...)",
  mercadopago: "Access Token (APP_USR-... ou TEST-...)",
};

const WEBHOOK_DICA: Record<GatewayPlataformaTipo, string> = {
  asaas: "Cole em Integrações → Webhooks, no painel do Asaas (mesma URL usada pelas empresas clientes).",
  stripe: "Cole em Developers → Webhooks, no painel da Stripe.",
  mercadopago: "Cole em Suas integrações → Webhooks, no painel do Mercado Pago.",
};

export function GatewayPlataformaCard({
  tipo,
  nome,
  descricao,
  status,
  ambiente,
  principal,
  temCredencial,
}: {
  tipo: GatewayPlataformaTipo;
  nome: string;
  descricao: string;
  status: string;
  ambiente: string;
  principal: boolean;
  temCredencial: boolean;
}) {
  const salvar = salvarCredencialGatewayPlataforma.bind(null, tipo);
  const [state, formAction, pending] = useActionState(salvar, initialState);
  const [, startTransition] = useTransition();
  const [testeMensagem, setTesteMensagem] = useState<string | null>(null);
  const [urlWebhook, setUrlWebhook] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    startTransition(() => setUrlWebhook(`${window.location.origin}/api/webhooks/${tipo}`));
  }, [tipo]);

  function copiarWebhook() {
    navigator.clipboard?.writeText(urlWebhook);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

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

        <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
          <Label className="text-xs text-muted-foreground">URL do webhook</Label>
          <div className="flex gap-2">
            <Input readOnly value={urlWebhook} className="text-xs" />
            <Button type="button" size="icon" variant="outline" onClick={copiarWebhook}>
              <Copy />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {copiado ? "Copiado!" : WEBHOOK_DICA[tipo]}
          </p>
        </div>

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
            <Label htmlFor={`apiKey-plataforma-${tipo}`}>{LABEL_CHAVE[tipo]}</Label>
            <Input
              id={`apiKey-plataforma-${tipo}`}
              name="apiKey"
              type="password"
              placeholder="••••••••"
            />
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
                  const r = await testarConexaoGatewayPlataforma(tipo);
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
                onClick={() => startTransition(() => definirGatewayPrincipalPlataforma(tipo))}
              >
                Tornar principal
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => startTransition(() => desconectarGatewayPlataforma(tipo))}
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
