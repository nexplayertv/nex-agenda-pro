// Espelha o catalogo semeado em supabase/migrations/0012_permissoes_catalogo.sql.
// Mantenha os dois em sincronia ao adicionar um novo recurso/acao.

export const RECURSOS = [
  "dashboard",
  "agenda",
  "agendamentos",
  "clientes",
  "servicos",
  "profissionais",
  "funcionarios",
  "pagamentos",
  "comprovantes_pix",
  "gateways",
  "financeiro",
  "receitas",
  "despesas",
  "comissoes",
  "relatorios",
  "mensagens",
  "notificacoes",
  "catalogo_publico",
  "avaliacoes",
  "configuracoes",
] as const;

export type Recurso = (typeof RECURSOS)[number];

export const ACOES = [
  "visualizar",
  "criar",
  "editar",
  "excluir",
  "confirmar",
  "cancelar",
  "exportar",
  "aprovar",
  "reembolsar",
] as const;

export type Acao = (typeof ACOES)[number];

export type PermissionKey = `${Recurso}.${Acao}`;

export function permissionKey(recurso: Recurso, acao: Acao): PermissionKey {
  return `${recurso}.${acao}`;
}
