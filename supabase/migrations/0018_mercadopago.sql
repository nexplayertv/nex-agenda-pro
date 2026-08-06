-- Adiciona o Mercado Pago como um terceiro gateway automatico valido, ao
-- lado de Asaas e Stripe. Sao os mesmos CHECK constraints criados em
-- 0006_agendamento_pagamento.sql, so que agora aceitando 'mercadopago'.
-- Os nomes abaixo sao os nomes padrao que o Postgres gera automaticamente
-- para constraints de coluna sem nome explicito (<tabela>_<coluna>_check).

alter table agendamentos drop constraint if exists agendamentos_forma_pagamento_check;
alter table agendamentos add constraint agendamentos_forma_pagamento_check
  check (forma_pagamento in ('asaas','stripe','mercadopago','pix_proprio','dinheiro','cartao_presencial','outro'));

alter table gateways_empresas drop constraint if exists gateways_empresas_tipo_check;
alter table gateways_empresas add constraint gateways_empresas_tipo_check
  check (tipo in ('asaas','stripe','mercadopago','pix_proprio'));

drop index if exists uq_gateway_principal_unico;
create unique index uq_gateway_principal_unico on gateways_empresas(empresa_id)
  where principal = true and tipo in ('asaas','stripe','mercadopago');

alter table pagamentos drop constraint if exists pagamentos_forma_pagamento_check;
alter table pagamentos add constraint pagamentos_forma_pagamento_check
  check (forma_pagamento in ('asaas','stripe','mercadopago','pix_proprio','dinheiro','cartao_presencial','outro'));

alter table pagamentos drop constraint if exists pagamentos_gateway_check;
alter table pagamentos add constraint pagamentos_gateway_check
  check (gateway in ('asaas','stripe','mercadopago','pix_proprio'));

alter table webhooks_pagamentos drop constraint if exists webhooks_pagamentos_gateway_check;
alter table webhooks_pagamentos add constraint webhooks_pagamentos_gateway_check
  check (gateway in ('asaas','stripe','mercadopago'));
