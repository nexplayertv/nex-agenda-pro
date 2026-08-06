export const STATUS_AGENDAMENTO_META: Record<
  string,
  { label: string; className: string }
> = {
  reserva_temporaria: {
    label: "Reserva temporária",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  aguardando_comprovante: {
    label: "Aguardando comprovante",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  comprovante_enviado: {
    label: "Comprovante enviado",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  pagamento_em_analise: {
    label: "Pagamento em análise",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  confirmado: {
    label: "Confirmado",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  em_atendimento: {
    label: "Em atendimento",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  finalizado: {
    label: "Finalizado",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  nao_compareceu: {
    label: "Não compareceu",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  reagendado: {
    label: "Reagendado",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  reembolsado: {
    label: "Reembolsado",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
};

export const STATUS_AGENDAMENTO_OPCOES = Object.keys(STATUS_AGENDAMENTO_META);

export const STATUS_PAGAMENTO_META: Record<string, { label: string }> = {
  pendente: { label: "Pendente" },
  pago: { label: "Pago" },
  expirado: { label: "Expirado" },
  recusado: { label: "Recusado" },
  cancelado: { label: "Cancelado" },
  reembolsado: { label: "Reembolsado" },
  em_analise: { label: "Em análise" },
};
