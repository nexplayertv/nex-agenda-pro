"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gerarPixCopiaECola } from "@/lib/payments/pix-brcode";
import { formatarDuracao, formatarMoeda } from "@/lib/utils-domain/masks";
import {
  buscarSlotsPublicoAction,
  criarReservaPublica,
  type ReservaState,
} from "@/app/(public)/agendar/[empresaSlug]/actions";
import { AutomaticoPaymentStep } from "./automatico-payment-step";
import { PixPaymentStep } from "./pix-payment-step";

type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  duracao_minutos: number;
  ocultar_valor: boolean;
};
type Profissional = { id: string; nome: string; foto_url: string | null; biografia: string | null };
type ChavePix = { chave: string; nomeTitular: string; nomeBanco: string; cidade: string } | null;

const initialState: ReservaState = { error: null };

const GATEWAY_LABEL: Record<"asaas" | "stripe" | "mercadopago", string> = {
  asaas: "Asaas",
  stripe: "Stripe",
  mercadopago: "Mercado Pago",
};

export function BookingFlow({
  empresaId,
  empresaSlug,
  empresaNome,
  servicos,
  profissionaisPorServico,
  percentualEntrada,
  gatewayAutomaticoTipo,
  chavePix,
}: {
  empresaId: string;
  empresaSlug: string;
  empresaNome: string;
  servicos: Servico[];
  profissionaisPorServico: Record<string, Profissional[]>;
  percentualEntrada: number;
  gatewayAutomaticoTipo: "asaas" | "stripe" | "mercadopago" | null;
  chavePix: ChavePix;
}) {
  const [etapa, setEtapa] = useState<"servico" | "profissional" | "horario" | "dados">("servico");
  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [carregandoSlots, startTransitionSlots] = useTransition();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const criarReserva = criarReservaPublica.bind(null, empresaId);
  const [state, formAction, pending] = useActionState(criarReserva, initialState);

  const servico = servicos.find((s) => s.id === servicoId);
  const valorEntrada = state.valorEntrada ?? 0;

  useEffect(() => {
    if (!profissionalId || !servicoId || !data) return;
    startTransitionSlots(async () => {
      const s = await buscarSlotsPublicoAction(empresaId, profissionalId, servicoId, data);
      setSlots(s);
      setHoraInicio("");
    });
  }, [empresaId, profissionalId, servicoId, data]);

  useEffect(() => {
    if (!state.agendamentoId || !chavePix) return;
    const pixCode = gerarPixCopiaECola({
      chave: chavePix.chave,
      nomeTitular: chavePix.nomeTitular,
      cidade: chavePix.cidade,
      valor: state.valorEntrada,
      identificador: state.agendamentoId.replace(/-/g, "").slice(0, 25),
    });
    QRCode.toDataURL(pixCode, { width: 240 }).then(setQrCodeDataUrl);
  }, [state.agendamentoId, state.valorEntrada, chavePix]);

  const hoje = new Date().toISOString().slice(0, 10);

  if (state.agendamentoId && state.gatewayAutomatico) {
    return (
      <AutomaticoPaymentStep
        agendamentoId={state.agendamentoId}
        empresaSlug={empresaSlug}
        valorEntrada={valorEntrada}
        pixCopiaECola={state.pixCopiaECola}
        qrCodeBase64={state.qrCodeBase64}
        urlPagamento={state.urlPagamento}
      />
    );
  }

  if (state.agendamentoId && chavePix) {
    const pixCode = gerarPixCopiaECola({
      chave: chavePix.chave,
      nomeTitular: chavePix.nomeTitular,
      cidade: chavePix.cidade,
      valor: valorEntrada,
      identificador: state.agendamentoId.replace(/-/g, "").slice(0, 25),
    });
    return (
      <PixPaymentStep
        agendamentoId={state.agendamentoId}
        empresaSlug={empresaSlug}
        pixCopiaECola={pixCode}
        chavePix={chavePix.chave}
        nomeTitular={chavePix.nomeTitular}
        banco={chavePix.nomeBanco}
        valorEntrada={valorEntrada}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    );
  }

  return (
    <div className="space-y-4">
      {etapa !== "servico" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setEtapa(
              etapa === "profissional"
                ? "servico"
                : etapa === "horario"
                  ? "profissional"
                  : "horario"
            )
          }
        >
          <ArrowLeft />
          Voltar
        </Button>
      )}

      {etapa === "servico" && (
        <div className="space-y-3">
          {servicos.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer transition-colors hover:border-primary"
              onClick={() => {
                setServicoId(s.id);
                setProfissionalId("");
                setEtapa("profissional");
              }}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{s.nome}</p>
                  {s.descricao && (
                    <p className="text-sm text-muted-foreground">{s.descricao}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatarDuracao(s.duracao_minutos)}
                  </p>
                </div>
                {!s.ocultar_valor && (
                  <Badge variant="secondary">{formatarMoeda(s.valor)}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {etapa === "profissional" && servico && (
        <div className="space-y-3">
          {(profissionaisPorServico[servicoId] ?? []).map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer transition-colors hover:border-primary"
              onClick={() => {
                setProfissionalId(p.id);
                setEtapa("horario");
              }}
            >
              <CardContent className="py-4">
                <p className="font-medium">{p.nome}</p>
                {p.biografia && <p className="text-sm text-muted-foreground">{p.biografia}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {etapa === "horario" && (
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Escolha a data</Label>
              <Input type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            {data && (
              <div className="space-y-2">
                <Label>Horários disponíveis</Label>
                {carregandoSlots && <p className="text-sm text-muted-foreground">Carregando...</p>}
                {!carregandoSlots && slots.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem horários disponíveis.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {!carregandoSlots &&
                    slots.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        size="sm"
                        variant={horaInicio === s ? "default" : "outline"}
                        onClick={() => setHoraInicio(s)}
                      >
                        {s}
                      </Button>
                    ))}
                </div>
              </div>
            )}
            <Button disabled={!horaInicio} onClick={() => setEtapa("dados")}>
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {etapa === "dados" && (
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
            <CardDescription>
              {servico?.nome} · {data} às {horaInicio}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="servicoId" value={servicoId} />
              <input type="hidden" name="profissionalId" value={profissionalId} />
              <input type="hidden" name="data" value={data} />
              <input type="hidden" name="horaInicio" value={horaInicio} />

              <div className="space-y-2">
                <Label htmlFor="nomeCliente">Nome completo</Label>
                <Input id="nomeCliente" name="nomeCliente" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" required placeholder="(11) 90000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail {gatewayAutomaticoTipo === "asaas" ? "" : "(opcional)"}</Label>
                <Input id="email" name="email" type="email" required={gatewayAutomaticoTipo === "asaas"} />
              </div>
              {gatewayAutomaticoTipo === "asaas" && (
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                  <Input id="cpfCnpj" name="cpfCnpj" required placeholder="000.000.000-00" />
                  <p className="text-xs text-muted-foreground">
                    Necessário para gerar a cobrança Pix.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" rows={2} />
              </div>

              {servico && (
                <div className="rounded-lg border p-3 text-sm">
                  <p>Valor total: {formatarMoeda(servico.valor)}</p>
                  <p>
                    Entrada ({percentualEntrada}%):{" "}
                    {formatarMoeda(Math.round(servico.valor * (percentualEntrada / 100) * 100) / 100)}
                  </p>
                  <p className="text-muted-foreground">
                    {gatewayAutomaticoTipo
                      ? `Pagamento via Pix, confirmado automaticamente (${GATEWAY_LABEL[gatewayAutomaticoTipo]}).`
                      : "Pagamento via Pix, confirmado manualmente pela empresa após o envio do comprovante."}
                  </p>
                </div>
              )}

              <label className="flex items-start gap-2 text-sm">
                <Checkbox name="aceiteTermos" value="true" required />
                <span>
                  Li e aceito os termos de uso e a política de cancelamento de {empresaNome}.
                </span>
              </label>

              {state.error && <p className="text-sm text-destructive">{state.error}</p>}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Reservando..." : "Reservar horário e pagar"}
                <Check />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
