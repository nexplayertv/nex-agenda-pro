-- Configuracoes globais da plataforma (nao pertencem a nenhuma empresa).
-- Tabela "singleton": sempre 1 linha so, id fixo em 1.

create table configuracoes_plataforma (
  id integer primary key default 1,
  whatsapp_suporte text,
  updated_at timestamptz not null default now(),
  constraint configuracoes_plataforma_singleton check (id = 1)
);

insert into configuracoes_plataforma (id) values (1) on conflict do nothing;

create trigger trg_configuracoes_plataforma_updated_at
  before update on configuracoes_plataforma
  for each row execute function set_updated_at();

alter table configuracoes_plataforma enable row level security;

-- Leitura livre pra qualquer usuario autenticado (ex.: mostrar o WhatsApp
-- de suporte na tela de acesso suspenso); escrita so pelo superadmin.
create policy configuracoes_plataforma_select on configuracoes_plataforma
  for select using (true);
create policy configuracoes_plataforma_write on configuracoes_plataforma
  for update using (is_superadmin(auth.uid())) with check (is_superadmin(auth.uid()));
