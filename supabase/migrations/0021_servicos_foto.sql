-- Foto ilustrativa do servico, mostrada no link publico de agendamento e
-- na tela de Servicos do painel (URL de texto livre, mesmo padrao ja usado
-- para logo_url das empresas).
alter table servicos add column if not exists foto_url text;
