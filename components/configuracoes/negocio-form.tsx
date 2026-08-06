"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SEGMENTOS } from "@/lib/utils-domain/segmentos";
import { salvarNegocio, type ActionState } from "@/app/(app)/configuracoes/actions";

const initialState: ActionState = { error: null };

export function NegocioForm({
  nome,
  segmento,
  descricao,
  telefone,
  whatsapp,
  email,
  endereco,
  instagram,
  facebook,
}: {
  nome: string;
  segmento: string;
  descricao: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  instagram: string | null;
  facebook: string | null;
}) {
  const [state, formAction, pending] = useActionState(salvarNegocio, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do negócio</Label>
          <Input id="nome" name="nome" defaultValue={nome} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segmento">Segmento</Label>
          <Select name="segmento" defaultValue={segmento}>
            <SelectTrigger id="segmento" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTOS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" defaultValue={descricao ?? ""} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" defaultValue={telefone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={whatsapp ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" name="endereco" defaultValue={endereco ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" defaultValue={instagram ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input id="facebook" name="facebook" defaultValue={facebook ?? ""} />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.sucesso && !state.error && (
        <p className="text-sm text-emerald-600">Informações salvas.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
