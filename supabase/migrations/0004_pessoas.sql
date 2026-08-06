-- Profissionais, funcionarios (acesso ao sistema) e clientes.

create table profissionais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  foto_url text,
  telefone text,
  email text,
  especialidades text[] not null default '{}',
  biografia text,
  comissao_percentual numeric(5,2) default 0,
  cor_agenda text not null default '#7C3AED',
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profissionais_empresa on profissionais(empresa_id);

create trigger trg_profissionais_updated_at
  before update on profissionais
  for each row execute function set_updated_at();

-- Funcionario = acesso ao sistema. Pode ou nao estar vinculado a um
-- profissional (ex.: recepcionista nao tem agenda propria).
create table funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  usuario_empresa_id uuid references usuarios_empresas(id),
  nome text not null,
  foto_url text,
  telefone text,
  email text not null,
  cargo_id uuid not null references cargos(id),
  profissional_id uuid references profissionais(id),
  data_contratacao date,
  dias_trabalho int2[] not null default '{1,2,3,4,5}',
  comissao_percentual numeric(5,2),
  observacoes text,
  status text not null default 'convidado' check (status in ('convidado','ativo','bloqueado','desligado')),
  ultimo_acesso_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_funcionarios_empresa on funcionarios(empresa_id);
create index idx_funcionarios_profissional on funcionarios(profissional_id);

create trigger trg_funcionarios_updated_at
  before update on funcionarios
  for each row execute function set_updated_at();

-- Suporta N:N caso um profissional seja atendido por mais de um login
-- (ex.: substituicao temporaria) sem depender apenas de funcionarios.profissional_id.
create table funcionarios_profissionais (
  funcionario_id uuid not null references funcionarios(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  primary key (funcionario_id, profissional_id)
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  foto_url text,
  whatsapp text,
  email text,
  data_nascimento date,
  endereco text,
  observacoes text,
  preferencias text,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clientes_empresa on clientes(empresa_id);
create index idx_clientes_whatsapp on clientes(empresa_id, whatsapp);

create trigger trg_clientes_updated_at
  before update on clientes
  for each row execute function set_updated_at();
