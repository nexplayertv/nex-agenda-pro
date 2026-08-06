-- Row Level Security: isolamento por empresa em todas as tabelas do tenant.
--
-- Camada de defesa: RLS garante que uma empresa NUNCA veja dados de outra.
-- As permissoes granulares (quem pode criar/editar/excluir dentro da
-- propria empresa) sao reforcadas na camada de aplicacao
-- (lib/permissions/requirePermission) em cada Server Action - ver
-- 0010_helper_functions.sql para tem_permissao(). Tabelas sensiveis
-- (credenciais_gateways, webhooks) ficam sem nenhuma policy: somente a
-- service role (usada em Edge Functions) consegue acessa-las.

grant execute on function is_superadmin(uuid) to authenticated, anon;
grant execute on function minha_empresa_id() to authenticated, anon;
grant execute on function meu_usuario_empresa_id() to authenticated, anon;
grant execute on function tem_permissao(uuid, text, text) to authenticated, anon;
grant execute on function sessao_valida(uuid, timestamptz) to authenticated, anon;

-- ---------------------------------------------------------------------
-- Tabelas padrao: possuem coluna empresa_id direta.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  tabelas text[] := array[
    'configuracoes_empresas','cargos','usuarios_empresas','funcionarios',
    'profissionais','clientes','categorias_servicos','servicos',
    'horarios_funcionamento','intervalos','folgas','ferias','bloqueios_agenda',
    'agendamentos','reservas_temporarias','gateways_empresas','chaves_pix',
    'pagamentos','comandas','receitas','despesas','comissoes',
    'templates_mensagens','historico_mensagens','avaliacoes','logs_atividades',
    'convites_funcionarios'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table %I enable row level security', t);
    execute format(
      $f$create policy %I on %I for select using (empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))$f$,
      t || '_select_empresa', t
    );
    execute format(
      $f$create policy %I on %I for insert with check (empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))$f$,
      t || '_insert_empresa', t
    );
    execute format(
      $f$create policy %I on %I for update using (empresa_id = minha_empresa_id() or is_superadmin(auth.uid())) with check (empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))$f$,
      t || '_update_empresa', t
    );
    execute format(
      $f$create policy %I on %I for delete using (empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))$f$,
      t || '_delete_empresa', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- sessoes_usuarios: visivel para o proprio usuario ou para a empresa dona
-- da sessao (para a tela "encerrar sessoes ativas").
-- ---------------------------------------------------------------------
alter table sessoes_usuarios enable row level security;

create policy sessoes_usuarios_select on sessoes_usuarios for select
  using (usuario_id = auth.uid() or empresa_id = minha_empresa_id() or is_superadmin(auth.uid()));
create policy sessoes_usuarios_insert on sessoes_usuarios for insert
  with check (usuario_id = auth.uid() or empresa_id = minha_empresa_id() or is_superadmin(auth.uid()));
create policy sessoes_usuarios_update on sessoes_usuarios for update
  using (usuario_id = auth.uid() or empresa_id = minha_empresa_id() or is_superadmin(auth.uid()));

-- ---------------------------------------------------------------------
-- notificacoes: visiveis quando gerais (usuario_id nulo) ou destinadas ao
-- proprio usuario, sempre dentro da empresa.
-- ---------------------------------------------------------------------
alter table notificacoes enable row level security;

create policy notificacoes_select on notificacoes for select
  using (
    is_superadmin(auth.uid())
    or (empresa_id = minha_empresa_id() and (usuario_id is null or usuario_id = auth.uid()))
  );
create policy notificacoes_insert on notificacoes for insert
  with check (empresa_id = minha_empresa_id() or is_superadmin(auth.uid()));
create policy notificacoes_update on notificacoes for update
  using (
    is_superadmin(auth.uid())
    or (empresa_id = minha_empresa_id() and (usuario_id is null or usuario_id = auth.uid()))
  );

-- ---------------------------------------------------------------------
-- Tabelas ligadas ao tenant por join (nao tem empresa_id direto).
-- ---------------------------------------------------------------------
alter table funcionarios_profissionais enable row level security;
create policy funcionarios_profissionais_all on funcionarios_profissionais for all
  using (exists (
    select 1 from profissionais p
    where p.id = funcionarios_profissionais.profissional_id
      and (p.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ))
  with check (exists (
    select 1 from profissionais p
    where p.id = funcionarios_profissionais.profissional_id
      and (p.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ));

alter table profissionais_servicos enable row level security;
create policy profissionais_servicos_all on profissionais_servicos for all
  using (exists (
    select 1 from profissionais p
    where p.id = profissionais_servicos.profissional_id
      and (p.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ))
  with check (exists (
    select 1 from profissionais p
    where p.id = profissionais_servicos.profissional_id
      and (p.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ));

alter table permissoes_cargos enable row level security;
create policy permissoes_cargos_all on permissoes_cargos for all
  using (exists (
    select 1 from cargos c
    where c.id = permissoes_cargos.cargo_id
      and (c.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ))
  with check (exists (
    select 1 from cargos c
    where c.id = permissoes_cargos.cargo_id
      and (c.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ));

alter table permissoes_usuarios enable row level security;
create policy permissoes_usuarios_all on permissoes_usuarios for all
  using (exists (
    select 1 from usuarios_empresas ue
    where ue.id = permissoes_usuarios.usuario_empresa_id
      and (ue.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ))
  with check (exists (
    select 1 from usuarios_empresas ue
    where ue.id = permissoes_usuarios.usuario_empresa_id
      and (ue.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ));

alter table itens_agendamento enable row level security;
create policy itens_agendamento_all on itens_agendamento for all
  using (exists (
    select 1 from agendamentos a
    where a.id = itens_agendamento.agendamento_id
      and (a.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ))
  with check (exists (
    select 1 from agendamentos a
    where a.id = itens_agendamento.agendamento_id
      and (a.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ));

alter table itens_comanda enable row level security;
create policy itens_comanda_all on itens_comanda for all
  using (exists (
    select 1 from comandas c
    where c.id = itens_comanda.comanda_id
      and (c.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ))
  with check (exists (
    select 1 from comandas c
    where c.id = itens_comanda.comanda_id
      and (c.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ));

alter table comprovantes_pagamentos enable row level security;
create policy comprovantes_pagamentos_all on comprovantes_pagamentos for all
  using (exists (
    select 1 from pagamentos pg
    where pg.id = comprovantes_pagamentos.pagamento_id
      and (pg.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ))
  with check (exists (
    select 1 from pagamentos pg
    where pg.id = comprovantes_pagamentos.pagamento_id
      and (pg.empresa_id = minha_empresa_id() or is_superadmin(auth.uid()))
  ));

-- ---------------------------------------------------------------------
-- empresas: cada usuario ve/edita apenas a propria empresa; criacao de
-- empresa e exclusiva do fluxo de onboarding (service role) ou superadmin.
-- ---------------------------------------------------------------------
alter table empresas enable row level security;

create policy empresas_select on empresas for select
  using (id = minha_empresa_id() or is_superadmin(auth.uid()));
create policy empresas_update on empresas for update
  using (
    is_superadmin(auth.uid())
    or (id = minha_empresa_id() and tem_permissao(id, 'configuracoes', 'editar'))
  );
create policy empresas_insert on empresas for insert
  with check (is_superadmin(auth.uid()));
create policy empresas_delete on empresas for delete
  using (is_superadmin(auth.uid()));

-- ---------------------------------------------------------------------
-- usuarios: perfil proprio, colegas da mesma empresa (para exibir nome/
-- foto em listagens) e superadmin.
-- ---------------------------------------------------------------------
alter table usuarios enable row level security;

create policy usuarios_select on usuarios for select
  using (
    id = auth.uid()
    or is_superadmin(auth.uid())
    or exists (
      select 1 from usuarios_empresas ue1
      join usuarios_empresas ue2 on ue2.empresa_id = ue1.empresa_id
      where ue1.usuario_id = auth.uid() and ue2.usuario_id = usuarios.id
    )
  );
create policy usuarios_insert on usuarios for insert
  with check (id = auth.uid() or is_superadmin(auth.uid()));
create policy usuarios_update on usuarios for update
  using (id = auth.uid() or is_superadmin(auth.uid()));

-- ---------------------------------------------------------------------
-- Catalogos globais (nao pertencem a nenhuma empresa): leitura livre,
-- escrita restrita ao superadmin.
-- ---------------------------------------------------------------------
alter table planos_saas enable row level security;
create policy planos_saas_select on planos_saas for select using (true);
create policy planos_saas_write on planos_saas for all
  using (is_superadmin(auth.uid())) with check (is_superadmin(auth.uid()));

alter table permissoes enable row level security;
create policy permissoes_select on permissoes for select using (true);
create policy permissoes_write on permissoes for all
  using (is_superadmin(auth.uid())) with check (is_superadmin(auth.uid()));

-- ---------------------------------------------------------------------
-- Financeiro do SaaS (assinaturas/pagamentos das empresas com a
-- plataforma): a empresa consulta o proprio historico; so o superadmin
-- escreve (cobranca e feita por rotina/webhook com service role).
-- ---------------------------------------------------------------------
alter table assinaturas_saas enable row level security;
create policy assinaturas_saas_select on assinaturas_saas for select
  using (empresa_id = minha_empresa_id() or is_superadmin(auth.uid()));
create policy assinaturas_saas_write on assinaturas_saas for all
  using (is_superadmin(auth.uid())) with check (is_superadmin(auth.uid()));

alter table pagamentos_saas enable row level security;
create policy pagamentos_saas_select on pagamentos_saas for select
  using (empresa_id = minha_empresa_id() or is_superadmin(auth.uid()));
create policy pagamentos_saas_write on pagamentos_saas for all
  using (is_superadmin(auth.uid())) with check (is_superadmin(auth.uid()));

-- ---------------------------------------------------------------------
-- Tabelas sem nenhuma policy: RLS habilitado e sem policies = acesso
-- negado para "anon"/"authenticated". Somente a service role (Edge
-- Functions de webhook / criptografia de credenciais) le e escreve aqui.
-- ---------------------------------------------------------------------
alter table credenciais_gateways enable row level security;
alter table webhooks_pagamentos enable row level security;
alter table logs_webhooks enable row level security;
