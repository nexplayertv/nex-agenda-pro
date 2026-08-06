-- Onboarding: cria a linha em public.usuarios automaticamente quando um
-- registro e criado em auth.users, e expoe uma funcao unica que cria uma
-- empresa nova (com config padrao, cargos padrao e assinatura trial) e
-- vincula o usuario que a criou como Administrador.

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into usuarios (id, nome, email, foto_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'foto_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create or replace function criar_empresa_onboarding(
  p_nome_empresa text,
  p_slug text,
  p_segmento text default 'geral'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_plano_id uuid;
  v_cargo_admin_id uuid;
  v_usuario_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select id into v_plano_id from planos_saas where slug = 'teste-gratuito' limit 1;

  insert into empresas (nome, slug, segmento, plano_id, status_assinatura, trial_expira_em)
  values (p_nome_empresa, p_slug, p_segmento, v_plano_id, 'trial', now() + interval '14 days')
  returning id into v_empresa_id;

  insert into configuracoes_empresas (empresa_id) values (v_empresa_id);

  perform criar_cargos_padrao(v_empresa_id);

  select id into v_cargo_admin_id from cargos
  where empresa_id = v_empresa_id and cargo_base = 'administrador';

  insert into usuarios_empresas (usuario_id, empresa_id, cargo_id, status)
  values (auth.uid(), v_empresa_id, v_cargo_admin_id, 'ativo')
  returning id into v_usuario_empresa_id;

  if v_plano_id is not null then
    insert into assinaturas_saas (empresa_id, plano_id, status, periodo_atual_inicio, periodo_atual_fim)
    values (v_empresa_id, v_plano_id, 'trial', now(), now() + interval '14 days');
  end if;

  insert into templates_mensagens (empresa_id, tipo, conteudo) values
    (v_empresa_id, 'confirmacao_agendamento', 'Olá, {nome_cliente}! Tudo bem? Seu atendimento de {servico} está confirmado para o dia {data}, às {horario}, com {nome_profissional}. Esperamos por você!'),
    (v_empresa_id, 'pagamento_aguardando', 'Olá, {nome_cliente}! Para confirmar seu horário de {servico} no dia {data} às {horario}, falta só a entrada de {valor_entrada}. Pode finalizar por aqui.'),
    (v_empresa_id, 'pagamento_confirmado', 'Recebemos o pagamento da sua entrada, {nome_cliente}! Seu horário de {servico} no dia {data} às {horario} está confirmado.'),
    (v_empresa_id, 'comprovante_recebido', 'Olá, {nome_cliente}! Recebemos o comprovante do seu pagamento e vamos confirmar em breve.'),
    (v_empresa_id, 'comprovante_recusado', 'Olá, {nome_cliente}, não conseguimos confirmar o comprovante enviado. Pode reenviar ou entrar em contato conosco pelo {whatsapp_empresa}?'),
    (v_empresa_id, 'lembrete_dia_anterior', 'Oi, {nome_cliente}! Passando para lembrar do seu horário amanhã, {data} às {horario}, para {servico}. Até lá!'),
    (v_empresa_id, 'lembrete_mesmo_dia', 'Oi, {nome_cliente}! Hoje é o dia do seu atendimento de {servico}, às {horario}. Te esperamos em {endereco}!'),
    (v_empresa_id, 'reagendamento', 'Olá, {nome_cliente}! Seu atendimento de {servico} foi reagendado para {data} às {horario}.'),
    (v_empresa_id, 'cancelamento', 'Olá, {nome_cliente}, seu agendamento de {servico} no dia {data} às {horario} foi cancelado. Qualquer dúvida, fale com a gente pelo {whatsapp_empresa}.'),
    (v_empresa_id, 'agradecimento', 'Obrigado pela visita, {nome_cliente}! Foi um prazer te atender no {servico}. Esperamos você na próxima!'),
    (v_empresa_id, 'solicitacao_avaliacao', 'Oi, {nome_cliente}! Como foi sua experiência com {servico}? Adoraríamos ouvir sua avaliação.'),
    (v_empresa_id, 'nao_compareceu', 'Olá, {nome_cliente}, sentimos sua falta no horário de {servico} de {data} às {horario}. Vamos reagendar?'),
    (v_empresa_id, 'valor_restante_pendente', 'Olá, {nome_cliente}! Ainda falta {valor_restante} referente ao seu atendimento de {servico}. Pode ser pago no dia, combinado?');

  return v_empresa_id;
end;
$$;

grant execute on function criar_empresa_onboarding(text, text, text) to authenticated;
