-- Catalogo de servicos e disponibilidade de horarios dos profissionais.

create table categorias_servicos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_categorias_servicos_empresa on categorias_servicos(empresa_id);

create table servicos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  categoria_id uuid references categorias_servicos(id) on delete set null,
  nome text not null,
  descricao text,
  imagem_url text,
  valor numeric(10,2) not null,
  duracao_minutos integer not null,
  intervalo_minutos integer not null default 0,
  destaque boolean not null default false,
  visivel_catalogo boolean not null default true,
  ordem integer not null default 0,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_servicos_empresa on servicos(empresa_id);

create trigger trg_servicos_updated_at
  before update on servicos
  for each row execute function set_updated_at();

create table profissionais_servicos (
  profissional_id uuid not null references profissionais(id) on delete cascade,
  servico_id uuid not null references servicos(id) on delete cascade,
  primary key (profissional_id, servico_id)
);

-- Expediente semanal. Se profissional_id for nulo, define o horario padrao
-- da empresa (usado no catalogo publico antes de escolher o profissional).
create table horarios_funcionamento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  profissional_id uuid references profissionais(id) on delete cascade,
  dia_semana int2 not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  created_at timestamptz not null default now()
);

create index idx_horarios_funcionamento_empresa on horarios_funcionamento(empresa_id);
create index idx_horarios_funcionamento_profissional on horarios_funcionamento(profissional_id);

create table intervalos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  dia_semana int2 not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null
);

create index idx_intervalos_profissional on intervalos(profissional_id);

create table folgas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  data date not null,
  motivo text
);

create index idx_folgas_profissional on folgas(profissional_id, data);

create table ferias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  data_inicio date not null,
  data_fim date not null,
  check (data_fim >= data_inicio)
);

create index idx_ferias_profissional on ferias(profissional_id);

-- Bloqueio manual de agenda (evento, feriado, manutencao). Se
-- profissional_id for nulo, bloqueia a empresa inteira no periodo.
create table bloqueios_agenda (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  profissional_id uuid references profissionais(id) on delete cascade,
  data_inicio timestamptz not null,
  data_fim timestamptz not null,
  motivo text,
  criado_por uuid references usuarios(id),
  created_at timestamptz not null default now(),
  check (data_fim > data_inicio)
);

create index idx_bloqueios_agenda_empresa on bloqueios_agenda(empresa_id);
create index idx_bloqueios_agenda_profissional on bloqueios_agenda(profissional_id);
