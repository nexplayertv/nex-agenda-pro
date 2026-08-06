-- Nucleo da plataforma SaaS: planos, empresas (tenants), assinaturas e
-- configuracoes de cada empresa. Tudo que pertence ao dono da plataforma
-- (nao ao tenant) fica sem empresa_id.

create table planos_saas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  valor_mensal numeric(10,2) not null default 0,
  valor_anual numeric(10,2),
  trial_dias integer not null default 14,
  limite_profissionais integer,
  limite_funcionarios integer,
  limite_usuarios integer,
  limite_agendamentos_mes integer,
  limite_armazenamento_mb integer,
  acesso_financeiro boolean not null default true,
  acesso_gateways boolean not null default true,
  acesso_catalogo boolean not null default true,
  acesso_notificacoes boolean not null default true,
  acesso_relatorios boolean not null default true,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_planos_saas_updated_at
  before update on planos_saas
  for each row execute function set_updated_at();

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  segmento text not null default 'geral',
  plano_id uuid references planos_saas(id),
  status_assinatura text not null default 'trial'
    check (status_assinatura in ('trial','ativa','pagamento_pendente','vencida','suspensa','cancelada')),
  trial_expira_em timestamptz,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_empresas_slug on empresas(slug);

create trigger trg_empresas_updated_at
  before update on empresas
  for each row execute function set_updated_at();

create table assinaturas_saas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  plano_id uuid not null references planos_saas(id),
  status text not null default 'trial'
    check (status in ('trial','ativa','pagamento_pendente','vencida','suspensa','cancelada')),
  periodo_atual_inicio timestamptz not null default now(),
  periodo_atual_fim timestamptz,
  cancelada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assinaturas_saas_empresa on assinaturas_saas(empresa_id);

create trigger trg_assinaturas_saas_updated_at
  before update on assinaturas_saas
  for each row execute function set_updated_at();

create table pagamentos_saas (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references assinaturas_saas(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  valor numeric(10,2) not null,
  status text not null default 'pendente'
    check (status in ('pendente','pago','falhou','reembolsado')),
  gateway text,
  transacao_id text,
  data_pagamento timestamptz,
  created_at timestamptz not null default now()
);

create index idx_pagamentos_saas_empresa on pagamentos_saas(empresa_id);

-- Uma linha por empresa com toda a personalizacao/configuracao do tenant.
create table configuracoes_empresas (
  empresa_id uuid primary key references empresas(id) on delete cascade,
  logo_url text,
  imagem_capa_url text,
  cor_primaria text not null default '#7C3AED',
  cor_secundaria text not null default '#F59E0B',
  descricao text,
  telefone text,
  whatsapp text,
  email text,
  endereco text,
  redes_sociais jsonb not null default '{}'::jsonb,
  moeda text not null default 'BRL',
  fuso_horario text not null default 'America/Sao_Paulo',
  politica_cancelamento text,
  catalogo_publico_ativo boolean not null default true,
  ocultar_valores_catalogo boolean not null default false,
  -- Regra de negocio: percentual global de entrada aplicado a TODOS os
  -- servicos. Nunca configurado por servico individualmente.
  percentual_entrada integer not null default 30
    check (percentual_entrada >= 0 and percentual_entrada <= 100),
  prazo_reserva_minutos integer not null default 15,
  prazo_comprovante_minutos integer not null default 60,
  prazo_analise_comprovante_minutos integer not null default 120,
  updated_at timestamptz not null default now()
);

create trigger trg_configuracoes_empresas_updated_at
  before update on configuracoes_empresas
  for each row execute function set_updated_at();
