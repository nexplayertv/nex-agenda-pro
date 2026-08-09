-- Credenciais do gateway usado pela PLATAFORMA (AgendaPro cobrando a
-- mensalidade das empresas), separado de credenciais_gateways (que guarda
-- a credencial de cada empresa cliente para cobrar os PROPRIOS clientes
-- dela). So uma linha por tipo; "principal" marca qual esta em uso por
-- renovarAssinatura().

create table credenciais_gateway_plataforma (
  id uuid primary key default gen_random_uuid(),
  tipo text not null unique check (tipo in ('asaas', 'stripe', 'mercadopago')),
  ambiente text not null default 'producao' check (ambiente in ('sandbox', 'producao')),
  status text not null default 'nao_configurado' check (status in (
    'nao_configurado', 'conectado', 'ativo', 'erro_conexao'
  )),
  principal boolean not null default false,
  dados_criptografados text not null,
  ultima_sincronizacao_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_credenciais_gateway_plataforma_updated_at
  before update on credenciais_gateway_plataforma
  for each row execute function set_updated_at();

-- Igual credenciais_gateways: nenhuma policy para authenticated/anon, so a
-- service role le/escreve. As Server Actions do Superadmin ja checam
-- ctx.isSuperadmin antes de chamar a service role.
alter table credenciais_gateway_plataforma enable row level security;
