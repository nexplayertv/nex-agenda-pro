-- Catalogo fixo de permissoes (recurso x acao). E dado de referencia
-- necessario para o app funcionar em qualquer ambiente (nao e "demo").

insert into permissoes (recurso, acao) values
  ('dashboard', 'visualizar'),
  ('agenda', 'visualizar'), ('agenda', 'criar'), ('agenda', 'editar'), ('agenda', 'excluir'), ('agenda', 'cancelar'),
  ('agendamentos', 'visualizar'), ('agendamentos', 'criar'), ('agendamentos', 'editar'), ('agendamentos', 'excluir'), ('agendamentos', 'confirmar'), ('agendamentos', 'cancelar'),
  ('clientes', 'visualizar'), ('clientes', 'criar'), ('clientes', 'editar'), ('clientes', 'excluir'), ('clientes', 'exportar'),
  ('servicos', 'visualizar'), ('servicos', 'criar'), ('servicos', 'editar'), ('servicos', 'excluir'),
  ('profissionais', 'visualizar'), ('profissionais', 'criar'), ('profissionais', 'editar'), ('profissionais', 'excluir'),
  ('funcionarios', 'visualizar'), ('funcionarios', 'criar'), ('funcionarios', 'editar'), ('funcionarios', 'excluir'),
  ('pagamentos', 'visualizar'), ('pagamentos', 'confirmar'), ('pagamentos', 'cancelar'), ('pagamentos', 'reembolsar'), ('pagamentos', 'exportar'),
  ('comprovantes_pix', 'visualizar'), ('comprovantes_pix', 'confirmar'), ('comprovantes_pix', 'cancelar'),
  ('gateways', 'visualizar'), ('gateways', 'editar'),
  ('financeiro', 'visualizar'), ('financeiro', 'exportar'),
  ('receitas', 'visualizar'), ('receitas', 'criar'), ('receitas', 'editar'), ('receitas', 'excluir'),
  ('despesas', 'visualizar'), ('despesas', 'criar'), ('despesas', 'editar'), ('despesas', 'excluir'),
  ('comissoes', 'visualizar'), ('comissoes', 'aprovar'), ('comissoes', 'exportar'),
  ('relatorios', 'visualizar'), ('relatorios', 'exportar'),
  ('mensagens', 'visualizar'), ('mensagens', 'criar'), ('mensagens', 'editar'),
  ('notificacoes', 'visualizar'),
  ('catalogo_publico', 'visualizar'), ('catalogo_publico', 'editar'),
  ('avaliacoes', 'visualizar'), ('avaliacoes', 'excluir'),
  ('configuracoes', 'visualizar'), ('configuracoes', 'editar')
on conflict (recurso, acao) do nothing;
