-- Planos padrao do SaaS. Valores de exemplo - ajuste em (superadmin) > Planos.

insert into planos_saas (nome, slug, valor_mensal, valor_anual, trial_dias, limite_profissionais, limite_funcionarios, limite_usuarios, limite_agendamentos_mes, limite_armazenamento_mb, ordem) values
  ('Teste gratuito', 'teste-gratuito', 0, 0, 14, 1, 1, 1, 50, 200, 0),
  ('Básico', 'basico', 49.90, 499.00, 0, 2, 3, 3, 300, 1024, 1),
  ('Profissional', 'profissional', 99.90, 999.00, 0, 5, 8, 8, 1000, 5120, 2),
  ('Premium', 'premium', 179.90, 1799.00, 0, null, null, null, null, 20480, 3)
on conflict (slug) do nothing;
