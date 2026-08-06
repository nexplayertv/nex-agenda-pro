-- Trilha de auditoria de acoes importantes realizadas por usuarios/funcionarios.

create table logs_atividades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  cargo_nome text,
  acao text not null,
  recurso text not null,
  registro_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip text,
  dispositivo text,
  criado_em timestamptz not null default now()
);

create index idx_logs_atividades_empresa on logs_atividades(empresa_id, criado_em desc);
create index idx_logs_atividades_registro on logs_atividades(recurso, registro_id);
