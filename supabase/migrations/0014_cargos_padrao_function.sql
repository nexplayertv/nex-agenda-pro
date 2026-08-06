-- criar_cargos_padrao(): chamada pelo fluxo de onboarding (Server Action)
-- toda vez que uma empresa nova e criada. Semeia os 5 cargos padrao da
-- especificacao com as permissoes default de cada um. O administrador
-- pode depois editar livremente (os cargos ficam marcados tipo='padrao'
-- mas as linhas de permissoes_cargos sao editaveis normalmente).

create or replace function criar_cargos_padrao(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_administrador uuid;
  v_gerente uuid;
  v_recepcionista uuid;
  v_profissional uuid;
  v_financeiro uuid;
begin
  insert into cargos (empresa_id, nome, tipo, cargo_base) values
    (p_empresa_id, 'Administrador', 'padrao', 'administrador')
    returning id into v_administrador;
  insert into cargos (empresa_id, nome, tipo, cargo_base) values
    (p_empresa_id, 'Gerente', 'padrao', 'gerente')
    returning id into v_gerente;
  insert into cargos (empresa_id, nome, tipo, cargo_base) values
    (p_empresa_id, 'Recepcionista', 'padrao', 'recepcionista')
    returning id into v_recepcionista;
  insert into cargos (empresa_id, nome, tipo, cargo_base) values
    (p_empresa_id, 'Profissional', 'padrao', 'profissional')
    returning id into v_profissional;
  insert into cargos (empresa_id, nome, tipo, cargo_base) values
    (p_empresa_id, 'Financeiro', 'padrao', 'financeiro')
    returning id into v_financeiro;

  -- Administrador: acesso completo.
  insert into permissoes_cargos (cargo_id, permissao_id, permitido)
  select v_administrador, id, true from permissoes;

  -- Gerente.
  insert into permissoes_cargos (cargo_id, permissao_id, permitido)
  select v_gerente, id, true from permissoes where (recurso, acao) in (
    ('dashboard','visualizar'),
    ('agenda','visualizar'),('agenda','criar'),('agenda','editar'),('agenda','excluir'),('agenda','cancelar'),
    ('agendamentos','visualizar'),('agendamentos','criar'),('agendamentos','editar'),('agendamentos','excluir'),('agendamentos','confirmar'),('agendamentos','cancelar'),
    ('clientes','visualizar'),('clientes','criar'),('clientes','editar'),('clientes','excluir'),('clientes','exportar'),
    ('servicos','visualizar'),('servicos','criar'),('servicos','editar'),('servicos','excluir'),
    ('profissionais','visualizar'),('profissionais','criar'),('profissionais','editar'),('profissionais','excluir'),
    ('funcionarios','visualizar'),('funcionarios','criar'),('funcionarios','editar'),
    ('pagamentos','visualizar'),('pagamentos','confirmar'),('pagamentos','cancelar'),
    ('comprovantes_pix','visualizar'),('comprovantes_pix','confirmar'),('comprovantes_pix','cancelar'),
    ('financeiro','visualizar'),('financeiro','exportar'),
    ('receitas','visualizar'),('despesas','visualizar'),
    ('comissoes','visualizar'),
    ('relatorios','visualizar'),('relatorios','exportar'),
    ('mensagens','visualizar'),('mensagens','criar'),('mensagens','editar'),
    ('notificacoes','visualizar'),
    ('catalogo_publico','visualizar'),('catalogo_publico','editar'),
    ('avaliacoes','visualizar'),
    ('configuracoes','visualizar')
  );

  -- Recepcionista.
  insert into permissoes_cargos (cargo_id, permissao_id, permitido)
  select v_recepcionista, id, true from permissoes where (recurso, acao) in (
    ('dashboard','visualizar'),
    ('agenda','visualizar'),('agenda','criar'),('agenda','editar'),('agenda','cancelar'),
    ('agendamentos','visualizar'),('agendamentos','criar'),('agendamentos','editar'),('agendamentos','confirmar'),('agendamentos','cancelar'),
    ('clientes','visualizar'),('clientes','criar'),('clientes','editar'),
    ('servicos','visualizar'),
    ('profissionais','visualizar'),
    ('pagamentos','visualizar'),('pagamentos','confirmar'),
    ('comprovantes_pix','visualizar'),('comprovantes_pix','confirmar'),
    ('mensagens','visualizar'),('mensagens','criar'),
    ('notificacoes','visualizar'),
    ('catalogo_publico','visualizar')
  );

  -- Profissional: por padrao enxerga so os proprios dados (ver
  -- usuarios_empresas.escopo_dados = 'proprio', aplicado pela aplicacao).
  insert into permissoes_cargos (cargo_id, permissao_id, permitido)
  select v_profissional, id, true from permissoes where (recurso, acao) in (
    ('dashboard','visualizar'),
    ('agenda','visualizar'),
    ('agendamentos','visualizar'),('agendamentos','editar'),('agendamentos','confirmar'),('agendamentos','cancelar'),
    ('clientes','visualizar'),
    ('comissoes','visualizar'),
    ('notificacoes','visualizar')
  );

  -- Financeiro.
  insert into permissoes_cargos (cargo_id, permissao_id, permitido)
  select v_financeiro, id, true from permissoes where (recurso, acao) in (
    ('dashboard','visualizar'),
    ('financeiro','visualizar'),('financeiro','exportar'),
    ('receitas','visualizar'),('receitas','criar'),('receitas','editar'),
    ('despesas','visualizar'),('despesas','criar'),('despesas','editar'),
    ('pagamentos','visualizar'),('pagamentos','confirmar'),('pagamentos','cancelar'),('pagamentos','reembolsar'),('pagamentos','exportar'),
    ('comprovantes_pix','visualizar'),('comprovantes_pix','confirmar'),('comprovantes_pix','cancelar'),
    ('comissoes','visualizar'),('comissoes','aprovar'),('comissoes','exportar'),
    ('relatorios','visualizar'),('relatorios','exportar'),
    ('notificacoes','visualizar')
  );
end;
$$;

grant execute on function criar_cargos_padrao(uuid) to authenticated, service_role;
