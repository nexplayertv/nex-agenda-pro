"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatarMoeda } from "@/lib/utils-domain/masks";
import {
  buscarSlotsAction,
  criarAgendamento,
  criarClienteRapido,
  type ActionState,
} from "@/app/(app)/agendamentos/actions";

type Cliente = { id: string; nome: string; whatsapp: string | null };
type Servico = { id: string; nome: string; valor: number; duracao_minutos: number };
type Profissional = { id: string; nome: string };

const initialState: ActionState = { error: null };

export function NovoAgendamentoForm({
  clientes,
  servicos,
  profissionais,
  percentualEntrada,
}: {
  clientes: Cliente[];
  servicos: Servico[];
  profissionais: Profissional[];
  percentualEntrada: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(criarAgendamento, initialState);
  const [, startTransition] = useTransition();
  const [carregandoSlots, startTransitionSlots] = useTransition();

  const [listaClientes, setListaClientes] = useState(clientes);
  const [clienteId, setClienteId] = useState("");
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteWhatsapp, setNovoClienteWhatsapp] = useState("");
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);

  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [formaPagamento, setFormaPagamento] = useState("pix_proprio");
  const [marcarComoPago, setMarcarComoPago] = useState(false);
  const [liberarSemPagamento, setLiberarSemPagamento] = useState(false);

  const servico = servicos.find((s) => s.id === servicoId);
  const valorEntrada = servico ? Math.round(servico.valor * (percentualEntrada / 100) * 100) / 100 : 0;
  const valorRestante = servico ? Math.round((servico.valor - valorEntrada) * 100) / 100 : 0;

  useEffect(() => {
    if (!profissionalId || !servicoId || !data) return;
    startTransitionSlots(async () => {
      const s = await buscarSlotsAction(profissionalId, servicoId, data);
      setSlots(s);
      setHoraInicio("");
    });
  }, [profissionalId, servicoId, data]);

  useEffect(() => {
    if (!state.error && state.sucesso) {
      router.push("/agenda");
    }
  }, [state, router]);

  function adicionarClienteRapido() {
    if (!novoClienteNome.trim()) return;
    startTransition(async () => {
      const resultado = await criarClienteRapido(novoClienteNome.trim(), novoClienteWhatsapp.trim());
      if ("id" in resultado) {
        setListaClientes((prev) => [
          { id: resultado.id, nome: novoClienteNome.trim(), whatsapp: novoClienteWhatsapp.trim() || null },
          ...prev,
        ]);
        setClienteId(resultado.id);
        setMostrarNovoCliente(false);
        setNovoClienteNome("");
        setNovoClienteWhatsapp("");
      }
    });
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="clienteId" value={clienteId} />
          <input type="hidden" name="servicoId" value={servicoId} />
          <input type="hidden" name="profissionalId" value={profissionalId} />
          <input type="hidden" name="data" value={data} />
          <input type="hidden" name="horaInicio" value={horaInicio} />
          <input type="hidden" name="marcarComoPago" value={marcarComoPago ? "true" : ""} />
          <input
            type="hidden"
            name="liberarSemPagamento"
            value={liberarSemPagamento ? "true" : ""}
          />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">1. Cliente</h3>
            {!mostrarNovoCliente ? (
              <div className="flex gap-2">
                <Select
                  items={Object.fromEntries(
                    listaClientes.map((c) => [c.id, `${c.nome}${c.whatsapp ? ` · ${c.whatsapp}` : ""}`])
                  )}
                  value={clienteId}
                  onValueChange={(v) => setClienteId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {listaClientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} {c.whatsapp ? `· ${c.whatsapp}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setMostrarNovoCliente(true)}>
                  Novo cliente
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input
                    value={novoClienteNome}
                    onChange={(e) => setNovoClienteNome(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>WhatsApp</Label>
                  <Input
                    value={novoClienteWhatsapp}
                    onChange={(e) => setNovoClienteWhatsapp(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={adicionarClienteRapido}>
                  Adicionar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setMostrarNovoCliente(false)}>
                  Cancelar
                </Button>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">2. Serviço e profissional</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Serviço</Label>
                <Select
                  items={Object.fromEntries(
                    servicos.map((s) => [s.id, `${s.nome} · ${formatarMoeda(s.valor)}`])
                  )}
                  value={servicoId}
                  onValueChange={(v) => setServicoId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome} · {formatarMoeda(s.valor)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Profissional</Label>
                <Select
                  items={Object.fromEntries(profissionais.map((p) => [p.id, p.nome]))}
                  value={profissionalId}
                  onValueChange={(v) => setProfissionalId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">3. Data e horário</h3>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input
                type="date"
                min={hoje}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="max-w-48"
              />
            </div>
            {data && profissionalId && servicoId && (
              <div className="space-y-1">
                <Label>Horários disponíveis</Label>
                {carregandoSlots && (
                  <p className="text-sm text-muted-foreground">Carregando horários...</p>
                )}
                {!carregandoSlots && slots.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário disponível nesse dia.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {!carregandoSlots &&
                    slots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      size="sm"
                      variant={horaInicio === slot ? "default" : "outline"}
                      onClick={() => setHoraInicio(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">4. Observações</h3>
            <Textarea name="observacoes" rows={2} placeholder="Opcional" />
          </section>

          <section className="space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">5. Pagamento</h3>
            {servico && (
              <p className="text-sm text-muted-foreground">
                Valor total {formatarMoeda(servico.valor)} · Entrada ({percentualEntrada}%){" "}
                {formatarMoeda(valorEntrada)} · Restante {formatarMoeda(valorRestante)}
              </p>
            )}
            <div className="space-y-1">
              <Label>Forma de pagamento</Label>
              <Select
                items={{
                  pix_proprio: "Pix",
                  dinheiro: "Dinheiro",
                  cartao_presencial: "Cartão (presencial)",
                  outro: "Outro",
                }}
                name="formaPagamento"
                value={formaPagamento}
                onValueChange={(v) => setFormaPagamento(v ?? "pix_proprio")}
              >
                <SelectTrigger className="w-full max-w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix_proprio">Pix</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_presencial">Cartão (presencial)</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={marcarComoPago}
                onCheckedChange={(c) => setMarcarComoPago(!!c)}
                disabled={liberarSemPagamento}
              />
              Já recebi a entrada, marcar como pago agora
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={liberarSemPagamento}
                onCheckedChange={(c) => setLiberarSemPagamento(!!c)}
              />
              Confirmar sem cobrar entrada agora (fica registrado no histórico)
            </label>
          </section>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button
            type="submit"
            disabled={pending || !clienteId || !servicoId || !profissionalId || !data || !horaInicio}
          >
            {pending ? "Criando..." : "Criar agendamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
