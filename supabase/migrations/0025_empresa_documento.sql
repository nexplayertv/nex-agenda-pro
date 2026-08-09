-- CPF ou CNPJ da empresa, exigido pelo Asaas (e outros gateways) para
-- gerar a cobranca da assinatura da plataforma.
alter table empresas add column cnpj_cpf text;
