-- Agendamentos e todo o fluxo de pagamento de entrada (Asaas, Stripe, Pix
-- proprio). Ver docs/pix.md, docs/asaas.md e docs/stripe.md.

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cliente_id uuid not null references clientes(id),
  profissional_id uuid not null references profissionais(id),
  servico_id uuid not null references servicos(id),
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  status text not null default 'reserva_temporaria' check (status in (
    'reserva_temporaria','aguardando_pagamento','aguardando_comprovante',
    'comprovante_enviado','pagamento_em_analise','confirmado',
    'em_atendimento','finalizado','cancelado','nao_compareceu',
    'reagendado','reembolsado'
  )),
  valor_total numeric(10,2) not null,
  -- Snapshot no momento da criacao: mudancas futuras na config global de
  -- entrada NUNCA alteram agendamentos ja existentes.
  percentual_entrada_aplicado integer not null,
  valor_entrada numeric(10,2) not null,
  valor_restante numeric(10,2) not null,
  forma_pagamento text check (forma_pagamento in ('asaas','stripe','pix_proprio','dinheiro','cartao_presencial','outro')),
  origem text not null default 'admin' check (origem in ('admin','publico')),
  observacoes text,
  agendamento_origem_id uuid references agendamentos(id),
  criado_por uuid references usuarios(id),
  liberado_sem_pagamento boolean not null default false,
  liberado_por uuid references usuarios(id),
  cancelado_em timestamptz,
  cancelado_motivo text,
  finalizado_em timestamptz,
  finalizado_por uuid references usuarios(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Faixa data+hora usada pelo exclusion constraint abaixo. Gerada pelo
  -- banco para garantir que a checagem de sobreposicao nunca fique
  -- dessincronizada dos campos data/hora_inicio/hora_fim.
  periodo tsrange generated always as (
    tsrange(data + hora_inicio, data + hora_fim, '[)')
  ) stored
);

create index idx_agendamentos_empresa_data on agendamentos(empresa_id, data);
create index idx_agendamentos_profissional_data on agendamentos(profissional_id, data);
create index idx_agendamentos_cliente on agendamentos(cliente_id);
create index idx_agendamentos_status on agendamentos(empresa_id, status);

create trigger trg_agendamentos_updated_at
  before update on agendamentos
  for each row execute function set_updated_at();

-- Impede, no proprio banco, dois agendamentos "vivos" com horarios que se
-- sobrepoem para o mesmo profissional - a validacao de conflito na Server
-- Action e apenas a primeira camada de UX, esta e a garantia final.
alter table agendamentos add constraint agendamentos_sem_sobreposicao
  exclude using gist (profissional_id with =, periodo with &&)
  where (status not in ('cancelado','reembolsado','reagendado'));

-- Servicos/produtos adicionais lancados no agendamento (alem do servico principal).
create table itens_agendamento (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null references agendamentos(id) on delete cascade,
  servico_id uuid references servicos(id),
  descricao text not null,
  valor numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index idx_itens_agendamento_agendamento on itens_agendamento(agendamento_id);

-- Controla o prazo de reserva antes do pagamento confirmar o horario.
create table reservas_temporarias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  agendamento_id uuid not null references agendamentos(id) on delete cascade,
  expira_em timestamptz not null,
  status text not null default 'ativa' check (status in ('ativa','convertida','expirada','cancelada')),
  created_at timestamptz not null default now()
);

create index idx_reservas_temporarias_status_expira on reservas_temporarias(status, expira_em);
create unique index uq_reservas_temporarias_agendamento on reservas_temporarias(agendamento_id);

create table gateways_empresas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo text not null check (tipo in ('asaas','stripe','pix_proprio')),
  ambiente text not null default 'sandbox' check (ambiente in ('sandbox','producao')),
  status text not null default 'nao_configurado' check (status in (
    'nao_configurado','aguardando_configuracao','conectado','ativo',
    'inativo','erro_conexao','erro_webhook'
  )),
  principal boolean not null default false,
  ultima_sincronizacao_em timestamptz,
  webhook_status text default 'nao_configurado' check (webhook_status in ('nao_configurado','ok','erro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, tipo)
);

create index idx_gateways_empresas_empresa on gateways_empresas(empresa_id);

create trigger trg_gateways_empresas_updated_at
  before update on gateways_empresas
  for each row execute function set_updated_at();

-- Regra dura: no maximo um gateway automatico (Asaas OU Stripe) marcado
-- como principal por empresa. Pix proprio nao entra nessa exclusividade.
create unique index uq_gateway_principal_unico on gateways_empresas(empresa_id)
  where principal = true and tipo in ('asaas','stripe');

-- Nunca legivel pela chave anon/authenticated (ver 0011_rls_policies.sql):
-- somente Edge Functions com service role acessam esta tabela.
create table credenciais_gateways (
  gateway_empresa_id uuid primary key references gateways_empresas(id) on delete cascade,
  dados_criptografados text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table chaves_pix (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo_chave text not null check (tipo_chave in ('cpf','cnpj','email','telefone','aleatoria')),
  chave text not null,
  nome_titular text not null,
  nome_banco text not null,
  cidade_recebedor text not null,
  conta_tipo text not null default 'pessoal' check (conta_tipo in ('pessoal','empresarial')),
  mensagem_orientacao text,
  prazo_pagamento_minutos integer not null default 60,
  prazo_comprovante_minutos integer not null default 60,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chaves_pix_empresa on chaves_pix(empresa_id);

create trigger trg_chaves_pix_updated_at
  before update on chaves_pix
  for each row execute function set_updated_at();

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  agendamento_id uuid not null references agendamentos(id) on delete cascade,
  tipo text not null default 'entrada' check (tipo in ('entrada','restante')),
  valor numeric(10,2) not null,
  forma_pagamento text not null check (forma_pagamento in ('asaas','stripe','pix_proprio','dinheiro','cartao_presencial','outro')),
  gateway text check (gateway in ('asaas','stripe','pix_proprio')),
  status text not null default 'pendente' check (status in (
    'pendente','pago','expirado','recusado','cancelado','reembolsado','em_analise'
  )),
  transacao_id text,
  taxa numeric(10,2) default 0,
  valor_liquido numeric(10,2),
  motivo_erro text,
  data_pagamento timestamptz,
  confirmado_por uuid references usuarios(id),
  confirmado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pagamentos_empresa on pagamentos(empresa_id);
create index idx_pagamentos_agendamento on pagamentos(agendamento_id);
create index idx_pagamentos_status on pagamentos(empresa_id, status);

create trigger trg_pagamentos_updated_at
  before update on pagamentos
  for each row execute function set_updated_at();

create table comprovantes_pagamentos (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid not null references pagamentos(id) on delete cascade,
  arquivo_url text not null,
  enviado_em timestamptz not null default now(),
  status text not null default 'enviado' check (status in ('enviado','confirmado','recusado')),
  motivo_recusa text,
  analisado_por uuid references usuarios(id),
  analisado_em timestamptz
);

create index idx_comprovantes_pagamento on comprovantes_pagamentos(pagamento_id);

create table webhooks_pagamentos (
  id uuid primary key default gen_random_uuid(),
  gateway text not null check (gateway in ('asaas','stripe')),
  evento_tipo text,
  payload jsonb not null,
  processado boolean not null default false,
  recebido_em timestamptz not null default now()
);

create table logs_webhooks (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references webhooks_pagamentos(id) on delete cascade,
  status text not null check (status in ('ok','erro')),
  erro text,
  created_at timestamptz not null default now()
);
