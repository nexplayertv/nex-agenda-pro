import { Badge } from "@/components/ui/badge";

const META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  nao_configurado: { label: "Não configurado", variant: "outline" },
  aguardando_configuracao: { label: "Aguardando configuração", variant: "secondary" },
  conectado: { label: "Conectado", variant: "secondary" },
  ativo: { label: "Ativo", variant: "default" },
  inativo: { label: "Inativo", variant: "secondary" },
  erro_conexao: { label: "Erro na conexão", variant: "destructive" },
  erro_webhook: { label: "Webhook com erro", variant: "destructive" },
};

export function GatewayStatusBadge({ status }: { status: string }) {
  const meta = META[status] ?? META.nao_configurado;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
