-- Nome completo (pessoa fisica) ou razao social (pessoa juridica) do
-- responsavel/empresa, usado como nome do cliente na cobranca de
-- assinatura da plataforma - pode divergir do nome fantasia (empresas.nome).
alter table empresas add column nome_completo text;
