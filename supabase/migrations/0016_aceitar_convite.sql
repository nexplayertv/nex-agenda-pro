-- aceitar_convite_funcionario(): chamada pelo funcionario logo depois de
-- definir a senha no link de convite (ver app/(public)/convite/[token]).
-- Roda SECURITY DEFINER porque o usuario ainda nao tem linha em
-- usuarios_empresas (portanto minha_empresa_id() retorna nulo e a policy
-- padrao de insert em usuarios_empresas bloquearia a operacao).

create or replace function aceitar_convite_funcionario(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_convite convites_funcionarios%rowtype;
  v_email_usuario text;
  v_funcionario_id uuid;
  v_usuario_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_convite from convites_funcionarios where token = p_token;

  if v_convite.id is null then
    raise exception 'Convite nao encontrado';
  end if;
  if v_convite.aceito_em is not null then
    raise exception 'Convite ja foi utilizado';
  end if;
  if v_convite.expira_em < now() then
    raise exception 'Convite expirado';
  end if;

  select email into v_email_usuario from usuarios where id = auth.uid();

  if v_email_usuario is null or lower(v_email_usuario) <> lower(v_convite.email) then
    raise exception 'Este convite foi enviado para outro e-mail';
  end if;

  insert into usuarios_empresas (usuario_id, empresa_id, cargo_id, status)
  values (auth.uid(), v_convite.empresa_id, v_convite.cargo_id, 'ativo')
  on conflict (usuario_id, empresa_id)
  do update set cargo_id = excluded.cargo_id, status = 'ativo', sessions_valid_since = now()
  returning id into v_usuario_empresa_id;

  select id into v_funcionario_id from funcionarios
  where empresa_id = v_convite.empresa_id and lower(email) = lower(v_convite.email);

  if v_funcionario_id is not null then
    update funcionarios
    set usuario_id = auth.uid(),
        usuario_empresa_id = v_usuario_empresa_id,
        profissional_id = coalesce(v_convite.profissional_id, profissional_id),
        status = 'ativo'
    where id = v_funcionario_id;
  end if;

  update convites_funcionarios set aceito_em = now() where id = v_convite.id;
end;
$$;

grant execute on function aceitar_convite_funcionario(uuid) to authenticated;
