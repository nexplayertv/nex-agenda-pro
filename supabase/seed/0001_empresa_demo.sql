-- Dados demonstrativos, usados apenas em ambiente local/desenvolvimento
-- (rodado por `supabase db reset`). NUNCA rode este arquivo em produção -
-- ver supabase/config.toml [db.seed] e docs/setup.md.
--
-- Este script roda como owner do banco (bypassa RLS), entao insere direto
-- nas tabelas em vez de usar as funcoes de onboarding (que exigem
-- auth.uid()). Para logar como administradora da empresa demo, crie um
-- usuario pelo /login (signup) e depois rode o bloco no final deste
-- arquivo para vincula-lo a esta empresa.

do $$
declare
  v_empresa_id uuid;
  v_cargo_admin_id uuid;
  v_categoria_id uuid;
  v_profissional_id uuid;
  v_servico_id uuid;
  v_cliente_id uuid;
begin
  insert into empresas (nome, slug, segmento, status_assinatura, trial_expira_em)
  values ('Studio Nail Demo', 'studio-nail-demo', 'nail_designer', 'trial', now() + interval '14 days')
  returning id into v_empresa_id;

  insert into configuracoes_empresas (
    empresa_id, descricao, telefone, whatsapp, email, endereco,
    percentual_entrada, politica_cancelamento
  ) values (
    v_empresa_id,
    'Studio de nail design especializado em unhas em gel e alongamento.',
    '(11) 4000-0000', '(11) 90000-0000', 'contato@studionaildemo.com.br',
    'Rua das Flores, 123 - São Paulo/SP',
    30,
    'Cancelamentos com menos de 24h de antecedência não têm a entrada reembolsada.'
  );

  perform criar_cargos_padrao(v_empresa_id);
  select id into v_cargo_admin_id from cargos where empresa_id = v_empresa_id and cargo_base = 'administrador';

  insert into categorias_servicos (empresa_id, nome, ordem) values (v_empresa_id, 'Unhas em gel', 0)
  returning id into v_categoria_id;

  insert into profissionais (empresa_id, nome, telefone, especialidades, comissao_percentual, cor_agenda, biografia)
  values (v_empresa_id, 'Giovanna Araújo', '(11) 90000-1111', array['Alongamento em gel','Nail art'], 40, '#7C3AED', 'Nail designer há 8 anos, especialista em alongamento em gel e nail art.')
  returning id into v_profissional_id;

  insert into servicos (empresa_id, categoria_id, nome, descricao, valor, duracao_minutos, intervalo_minutos, destaque, visivel_catalogo)
  values (v_empresa_id, v_categoria_id, 'Manutenção de gel na tip', 'Manutenção completa com remoção, esculturação e acabamento.', 100.00, 120, 10, true, true)
  returning id into v_servico_id;

  insert into profissionais_servicos (profissional_id, servico_id) values (v_profissional_id, v_servico_id);

  insert into horarios_funcionamento (empresa_id, profissional_id, dia_semana, hora_inicio, hora_fim)
  select v_empresa_id, v_profissional_id, dia, '09:00', '18:00' from generate_series(1,6) as dia;

  insert into clientes (empresa_id, nome, whatsapp, email)
  values (v_empresa_id, 'Ana Beatriz Souza', '(11) 98888-2222', 'ana.souza@example.com')
  returning id into v_cliente_id;

  insert into templates_mensagens (empresa_id, tipo, conteudo) values
    (v_empresa_id, 'confirmacao_agendamento', 'Olá, {nome_cliente}! Tudo bem? Seu atendimento de {servico} está confirmado para o dia {data}, às {horario}, com {nome_profissional}. Esperamos por você!'),
    (v_empresa_id, 'lembrete_dia_anterior', 'Oi, {nome_cliente}! Passando para lembrar do seu horário amanhã, {data} às {horario}, para {servico}. Até lá!'),
    (v_empresa_id, 'pagamento_confirmado', 'Recebemos o pagamento da sua entrada, {nome_cliente}! Seu horário no dia {data} às {horario} está confirmado.'),
    (v_empresa_id, 'valor_restante_pendente', 'Olá, {nome_cliente}! Ainda falta {valor_restante} referente ao seu atendimento de {servico}. Pode ser pago no dia, combinado?');

  raise notice 'Empresa demo criada: % (slug: studio-nail-demo)', v_empresa_id;
end $$;

-- Depois de criar sua conta pelo formulario de login/signup do app, rode
-- (substituindo o e-mail) para virar administrador da empresa demo:
--
-- insert into usuarios_empresas (usuario_id, empresa_id, cargo_id, status)
-- select u.id, e.id, c.id, 'ativo'
-- from usuarios u, empresas e, cargos c
-- where u.email = 'voce@exemplo.com'
--   and e.slug = 'studio-nail-demo'
--   and c.empresa_id = e.id and c.cargo_base = 'administrador'
-- on conflict (usuario_id, empresa_id) do update set cargo_id = excluded.cargo_id, status = 'ativo';
