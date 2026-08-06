export type AgendamentoAgenda = {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  valor_total: number;
  valor_entrada: number;
  valor_restante: number;
  forma_pagamento: string | null;
  observacoes: string | null;
  clientes: { id: string; nome: string; whatsapp: string | null; foto_url: string | null } | null;
  profissionais: { id: string; nome: string; cor_agenda: string } | null;
  servicos: { id: string; nome: string; duracao_minutos: number } | null;
};
