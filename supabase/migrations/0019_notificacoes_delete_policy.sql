-- 0011_rls_policies.sql criou select/insert/update para notificacoes mas
-- esqueceu delete - o botao "Limpar todas" fazia a chamada, RLS bloqueava
-- silenciosamente (sem erro, so 0 linhas afetadas), entao parecia que nada
-- acontecia ao clicar.

create policy notificacoes_delete on notificacoes for delete
  using (
    is_superadmin(auth.uid())
    or (empresa_id = minha_empresa_id() and (usuario_id is null or usuario_id = auth.uid()))
  );
