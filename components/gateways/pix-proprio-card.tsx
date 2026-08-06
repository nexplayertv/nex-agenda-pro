"use client";

import { useActionState, useTransition } from "react";
import { Landmark } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { GatewayStatusBadge } from "./gateway-status-badge";
import { alternarPixAtivo, salvarChavePix, type ActionState } from "@/app/(app)/gateways/actions";

const initialState: ActionState = { error: null };

export type ChavePixExistente = {
  tipo_chave: string;
  chave: string;
  nome_titular: string;
  nome_banco: string;
  cidade_recebedor: string;
  conta_tipo: string;
  mensagem_orientacao: string | null;
  prazo_pagamento_minutos: number;
  prazo_comprovante_minutos: number;
} | null;

export function PixProprioCard({
  status,
  chave,
}: {
  status: string;
  chave: ChavePixExistente;
}) {
  const [state, formAction, pending] = useActionState(salvarChavePix, initialState);
  const [, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="size-5" />
            <CardTitle>Pix próprio</CardTitle>
          </div>
          <GatewayStatusBadge status={status} />
        </div>
        <CardDescription>Receba a entrada direto na sua chave Pix, sem intermediário.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "ativo" && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <p className="text-sm">Ativo para o link público</p>
            <Switch
              checked={status === "ativo"}
              onCheckedChange={(v) => startTransition(() => alternarPixAtivo(v))}
            />
          </div>
        )}

        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de chave</Label>
            <Select name="tipoChave" defaultValue={chave?.tipo_chave ?? "aleatoria"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="aleatoria">Chave aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chave">Chave Pix</Label>
            <Input id="chave" name="chave" defaultValue={chave?.chave ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nomeTitular">Nome do titular</Label>
            <Input id="nomeTitular" name="nomeTitular" defaultValue={chave?.nome_titular ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nomeBanco">Banco</Label>
            <Input id="nomeBanco" name="nomeBanco" defaultValue={chave?.nome_banco ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidadeRecebedor">Cidade do recebedor</Label>
            <Input
              id="cidadeRecebedor"
              name="cidadeRecebedor"
              defaultValue={chave?.cidade_recebedor ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de conta</Label>
            <Select name="contaTipo" defaultValue={chave?.conta_tipo ?? "pessoal"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pessoal">Pessoal</SelectItem>
                <SelectItem value="empresarial">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prazoPagamentoMinutos">Prazo p/ pagar (min)</Label>
            <Input
              id="prazoPagamentoMinutos"
              name="prazoPagamentoMinutos"
              type="number"
              defaultValue={chave?.prazo_pagamento_minutos ?? 60}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prazoComprovanteMinutos">Prazo p/ comprovante (min)</Label>
            <Input
              id="prazoComprovanteMinutos"
              name="prazoComprovanteMinutos"
              type="number"
              defaultValue={chave?.prazo_comprovante_minutos ?? 60}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mensagemOrientacao">Mensagem de orientação (opcional)</Label>
            <Textarea
              id="mensagemOrientacao"
              name="mensagemOrientacao"
              defaultValue={chave?.mensagem_orientacao ?? ""}
              rows={2}
            />
          </div>

          {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
          {state.sucesso && !state.error && (
            <p className="text-sm text-emerald-600 sm:col-span-2">Chave Pix salva e ativada.</p>
          )}

          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? "Salvando..." : "Salvar chave Pix"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
