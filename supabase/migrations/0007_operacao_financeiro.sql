-- Comandas de atendimento, financeiro (receitas/despesas) e comissoes.

create table comandas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  agendamento_id uuid not null references agendamentos(id) on delete cascade,
  desconto numeric(10,2) not null default 0,
  valor_total numeric(10,2) not null default 0,
  forma_pagamento_final text check (forma_pagamento_final in ('pix','dinheiro','cartao_debito','cartao_credito','outro')),
  observacoes text,
  status text not null default 'aberta' check (status in ('aberta','finalizada','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_comandas_empresa on comandas(empresa_id);
create unique index uq_comandas_agendamento on comandas(agendamento_id);

create trigger trg_comandas_updated_at
  before update on comandas
  for each row execute function set_updated_at();

create table itens_comanda (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas(id) on delete cascade,
  tipo text not null check (tipo in ('servico','produto','desconto')),
  descricao text not null,
  valor numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index idx_itens_comanda_comanda on itens_comanda(comanda_id);

create table receitas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  origem text not null default 'agendamento' check (origem in ('agendamento','manual')),
  agendamento_id uuid references agendamentos(id),
  pagamento_id uuid references pagamentos(id),
  categoria text,
  descricao text,
  valor numeric(10,2) not null,
  forma_pagamento text,
  data date not null default current_date,
  criado_por uuid references usuarios(id),
  created_at timestamptz not null default now()
);

create index idx_receitas_empresa_data on receitas(empresa_id, data);

create table despesas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  descricao text not null,
  categoria text,
  valor numeric(10,2) not null,
  data date not null default current_date,
  criado_por uuid references usuarios(id),
  created_at timestamptz not null default now()
);

create index idx_despesas_empresa_data on despesas(empresa_id, data);

create table comissoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  profissional_id uuid not null references profissionais(id),
  funcionario_id uuid references funcionarios(id),
  agendamento_id uuid not null references agendamentos(id),
  tipo_calculo text not null default 'percentual' check (tipo_calculo in ('percentual','valor_fixo')),
  base_calculo text not null default 'valor_recebido' check (base_calculo in ('valor_total','valor_recebido')),
  percentual numeric(5,2),
  valor_fixo numeric(10,2),
  valor numeric(10,2) not null,
  status text not null default 'pendente' check (status in ('pendente','disponivel','pago','cancelado','estornado')),
  data_disponivel date,
  data_pagamento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_comissoes_empresa on comissoes(empresa_id);
create index idx_comissoes_profissional on comissoes(profissional_id);
create index idx_comissoes_agendamento on comissoes(agendamento_id);

create trigger trg_comissoes_updated_at
  before update on comissoes
  for each row execute function set_updated_at();
