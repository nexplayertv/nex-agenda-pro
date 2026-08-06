-- Templates de mensagem (WhatsApp), historico de envios, notificacoes
-- internas e avaliacoes de clientes.

create table templates_mensagens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo text not null check (tipo in (
    'confirmacao_agendamento','pagamento_aguardando','pagamento_confirmado',
    'comprovante_recebido','comprovante_recusado','lembrete_dia_anterior',
    'lembrete_mesmo_dia','reagendamento','cancelamento','agradecimento',
    'solicitacao_avaliacao','nao_compareceu','valor_restante_pendente'
  )),
  conteudo text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, tipo)
);

create index idx_templates_mensagens_empresa on templates_mensagens(empresa_id);

create trigger trg_templates_mensagens_updated_at
  before update on templates_mensagens
  for each row execute function set_updated_at();

create table historico_mensagens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cliente_id uuid not null references clientes(id),
  agendamento_id uuid references agendamentos(id),
  template_id uuid references templates_mensagens(id),
  conteudo_final text not null,
  canal text not null default 'whatsapp' check (canal in ('whatsapp','email')),
  enviado_por uuid references usuarios(id),
  enviado_em timestamptz not null default now()
);

create index idx_historico_mensagens_empresa on historico_mensagens(empresa_id);
create index idx_historico_mensagens_cliente on historico_mensagens(cliente_id);

create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  -- usuario_id nulo = visivel para todos os usuarios autorizados da empresa
  usuario_id uuid references usuarios(id),
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  link text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

create index idx_notificacoes_empresa_usuario on notificacoes(empresa_id, usuario_id, lida);

create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  agendamento_id uuid not null references agendamentos(id),
  cliente_id uuid not null references clientes(id),
  nota int2 not null check (nota between 1 and 5),
  comentario text,
  created_at timestamptz not null default now(),
  unique (agendamento_id)
);

create index idx_avaliacoes_empresa on avaliacoes(empresa_id);
