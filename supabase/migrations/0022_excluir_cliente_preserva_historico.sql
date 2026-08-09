-- Permite excluir um cliente definitivamente mesmo que ele ja tenha
-- agendamentos, mensagens ou avaliacoes. Em vez de bloquear a exclusao
-- (comportamento anterior), cliente_id passa a aceitar nulo nessas tabelas
-- e a FK muda para "on delete set null": o historico continua existindo,
-- so perde o vinculo com o cliente removido.

alter table agendamentos
  alter column cliente_id drop not null,
  drop constraint agendamentos_cliente_id_fkey,
  add constraint agendamentos_cliente_id_fkey
    foreign key (cliente_id) references clientes(id) on delete set null;

alter table historico_mensagens
  alter column cliente_id drop not null,
  drop constraint historico_mensagens_cliente_id_fkey,
  add constraint historico_mensagens_cliente_id_fkey
    foreign key (cliente_id) references clientes(id) on delete set null;

alter table avaliacoes
  alter column cliente_id drop not null,
  drop constraint avaliacoes_cliente_id_fkey,
  add constraint avaliacoes_cliente_id_fkey
    foreign key (cliente_id) references clientes(id) on delete set null;
