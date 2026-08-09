-- Meta de crescimento (%) sobre o faturamento do mes anterior, usada pra
-- calcular a projecao de vendas esperada num periodo qualquer dentro do
-- mes atual (ver /financeiro).
alter table configuracoes_empresas
  add column meta_crescimento_percentual numeric(6,2);
