"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  criarProfissional,
  editarProfissional,
  type ActionState,
} from "@/app/(app)/profissionais/actions";
import { HorariosEditor, type HorarioExistente } from "./horarios-editor";

export type ProfissionalExistente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  especialidades: string[];
  biografia: string | null;
  comissao_percentual: number | null;
  cor_agenda: string;
  foto_url: string | null;
};

const initialState: ActionState = { error: null };
const CORES = ["#7C3AED", "#F59E0B", "#0EA5E9", "#10B981", "#EC4899", "#EF4444"];

export function ProfissionalFormDialog({
  profissional,
  horarios = [],
  trigger,
}: {
  profissional?: ProfissionalExistente;
  horarios?: HorarioExistente[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [cor, setCor] = useState(profissional?.cor_agenda ?? CORES[0]);
  const action = profissional ? editarProfissional.bind(null, profissional.id) : criarProfissional;
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button>
              <Plus />
              Novo profissional
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{profissional ? "Editar profissional" : "Novo profissional"}</DialogTitle>
          <DialogDescription>
            Dados, especialidades e horários de atendimento na agenda.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="horarios" disabled={!profissional}>
              Horários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="pt-2">
            <form action={formAction}>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" name="nome" defaultValue={profissional?.nome} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      defaultValue={profissional?.telefone ?? ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={profissional?.email ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comissaoPercentual">Comissão (%)</Label>
                    <Input
                      id="comissaoPercentual"
                      name="comissaoPercentual"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      defaultValue={profissional?.comissao_percentual ?? 0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="especialidades">Especialidades (separadas por vírgula)</Label>
                  <Input
                    id="especialidades"
                    name="especialidades"
                    defaultValue={profissional?.especialidades?.join(", ") ?? ""}
                    placeholder="Alongamento em gel, Nail art"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fotoUrl">URL da foto (opcional)</Label>
                  <Input
                    id="fotoUrl"
                    name="fotoUrl"
                    placeholder="https://..."
                    defaultValue={profissional?.foto_url ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biografia">Biografia (catálogo público)</Label>
                  <Textarea
                    id="biografia"
                    name="biografia"
                    rows={2}
                    defaultValue={profissional?.biografia ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor na agenda</Label>
                  <input type="hidden" name="corAgenda" value={cor} />
                  <div className="flex gap-2">
                    {CORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        className="size-7 rounded-full ring-offset-2 outline-none"
                        style={{
                          backgroundColor: c,
                          boxShadow: cor === c ? `0 0 0 2px ${c}` : undefined,
                        }}
                        aria-label={`Selecionar cor ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {state.error && <p className="pb-2 text-sm text-destructive">{state.error}</p>}

              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="horarios" className="pt-2">
            {profissional && (
              <HorariosEditor profissionalId={profissional.id} horarios={horarios} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
