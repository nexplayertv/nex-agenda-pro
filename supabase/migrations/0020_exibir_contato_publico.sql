-- Permite ligar/desligar cada icone de contato (localizacao, WhatsApp,
-- Instagram) no link publico de agendamento sem precisar apagar o dado
-- em si (ex.: manter o endereco cadastrado mas esconder o icone do mapa).

alter table configuracoes_empresas
  add column if not exists exibir_localizacao boolean not null default true,
  add column if not exists exibir_whatsapp_publico boolean not null default true,
  add column if not exists exibir_instagram boolean not null default true;
