-- Identidade, vinculo com empresas, cargos e permissoes granulares.

-- Espelha auth.users com dados de perfil usados pela aplicacao.
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  foto_url text,
  tipo text not null default 'empresa' check (tipo in ('superadmin','empresa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_usuarios_updated_at
  before update on usuarios
  for each row execute function set_updated_at();

-- Cargos sempre pertencem a uma empresa: os 5 padroes sao semeados na
-- criacao da empresa (tipo = 'padrao') e podem ser clonados/editados.
create table cargos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  tipo text not null default 'personalizado' check (tipo in ('padrao','personalizado')),
  cargo_base text check (cargo_base in ('administrador','gerente','recepcionista','profissional','financeiro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, nome)
);

create index idx_cargos_empresa on cargos(empresa_id);

create trigger trg_cargos_updated_at
  before update on cargos
  for each row execute function set_updated_at();

-- Catalogo fixo de permissoes (recurso x acao). Nao e por empresa.
create table permissoes (
  id uuid primary key default gen_random_uuid(),
  recurso text not null,
  acao text not null
    check (acao in ('visualizar','criar','editar','excluir','confirmar','cancelar','exportar','aprovar','reembolsar')),
  descricao text,
  unique (recurso, acao)
);

create table permissoes_cargos (
  cargo_id uuid not null references cargos(id) on delete cascade,
  permissao_id uuid not null references permissoes(id) on delete cascade,
  permitido boolean not null default false,
  primary key (cargo_id, permissao_id)
);

-- Empresa <-> usuario, com o cargo atribuido. Um usuario pode, em teoria,
-- pertencer a mais de uma empresa; a UI atual assume uma sessao ativa.
create table usuarios_empresas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  cargo_id uuid not null references cargos(id),
  status text not null default 'ativo' check (status in ('ativo','bloqueado','desligado')),
  -- 'proprio' restringe consultas (agenda, clientes, comissao) ao
  -- profissional vinculado a este usuario; ver funcionarios.profissional_id.
  escopo_dados text not null default 'total' check (escopo_dados in ('proprio','total')),
  -- Qualquer JWT emitido antes deste timestamp e considerado invalido.
  -- E assim que bloqueio/desligamento derruba sessoes abertas na hora.
  sessions_valid_since timestamptz not null default now(),
  ultimo_acesso_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, empresa_id)
);

create index idx_usuarios_empresas_usuario on usuarios_empresas(usuario_id);
create index idx_usuarios_empresas_empresa on usuarios_empresas(empresa_id);

create trigger trg_usuarios_empresas_updated_at
  before update on usuarios_empresas
  for each row execute function set_updated_at();

-- Overrides individuais de permissao (sobrepoe o cargo).
create table permissoes_usuarios (
  usuario_empresa_id uuid not null references usuarios_empresas(id) on delete cascade,
  permissao_id uuid not null references permissoes(id) on delete cascade,
  permitido boolean not null default false,
  primary key (usuario_empresa_id, permissao_id)
);

-- Registro de sessoes/dispositivos, usado na tela "encerrar sessoes ativas".
create table sessoes_usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  empresa_id uuid references empresas(id) on delete cascade,
  dispositivo text,
  ip text,
  criado_em timestamptz not null default now(),
  revogado_em timestamptz
);

create index idx_sessoes_usuarios_usuario on sessoes_usuarios(usuario_id);

create table convites_funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  email text not null,
  cargo_id uuid not null references cargos(id),
  profissional_id uuid,
  token uuid not null default gen_random_uuid(),
  expira_em timestamptz not null default (now() + interval '7 days'),
  aceito_em timestamptz,
  criado_por uuid references usuarios(id),
  created_at timestamptz not null default now()
);

create unique index idx_convites_funcionarios_token on convites_funcionarios(token);
create index idx_convites_funcionarios_empresa on convites_funcionarios(empresa_id);
