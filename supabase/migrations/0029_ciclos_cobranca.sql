-- Ciclos de cobranca da assinatura da plataforma (Mensal/Trimestral/etc.),
-- cada um com preco e duracao proprios. Antes so existia "valor_mensal"
-- fixo em planos_saas, sempre renovando por 30 dias, entao nao tinha como
-- oferecer periodos diferentes (o valor pago nao mudava quantos dias eram
-- liberados).

create table ciclos_cobranca_saas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  periodo_dias integer not null check (periodo_dias > 0),
  valor numeric(10,2) not null check (valor > 0),
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_ciclos_cobranca_saas_updated_at
  before update on ciclos_cobranca_saas
  for each row execute function set_updated_at();

alter table ciclos_cobranca_saas enable row level security;

-- Leitura livre (a empresa precisa ver as opcoes na tela de renovacao),
-- escrita so pelo superadmin.
create policy ciclos_cobranca_saas_select on ciclos_cobranca_saas
  for select using (true);
create policy ciclos_cobranca_saas_write on ciclos_cobranca_saas
  for all using (is_superadmin(auth.uid())) with check (is_superadmin(auth.uid()));

-- Semeia o ciclo "Mensal" com o valor que ja estava em planos_saas, pra
-- nao quebrar a renovacao de quem ja estava usando o sistema.
insert into ciclos_cobranca_saas (nome, periodo_dias, valor, ordem)
select 'Mensal', 30, valor_mensal, 0
from planos_saas
where ativo = true
limit 1;

-- Snapshot do ciclo usado em cada cobranca - se o preco/periodo do ciclo
-- mudar depois, cobrancas ja criadas nao sao afetadas (mesmo principio ja
-- usado em agendamentos.percentual_entrada_aplicado).
alter table pagamentos_saas
  add column ciclo_id uuid references ciclos_cobranca_saas(id),
  add column periodo_dias integer not null default 30;
