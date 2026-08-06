-- Funcoes auxiliares usadas pelas policies de RLS (0011). Sao SECURITY
-- DEFINER de proposito: precisam ler usuarios_empresas/permissoes sem
-- disparar recursivamente as proprias policies de RLS dessas tabelas.

create or replace function is_superadmin(p_usuario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuarios
    where id = p_usuario_id and tipo = 'superadmin'
  );
$$;

-- Empresa ativa do usuario autenticado (v1: um usuario pertence a uma
-- unica empresa operante por vez).
create or replace function minha_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from usuarios_empresas
  where usuario_id = auth.uid() and status = 'ativo'
  limit 1;
$$;

create or replace function meu_usuario_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from usuarios_empresas
  where usuario_id = auth.uid() and status = 'ativo'
  limit 1;
$$;

-- Override individual (permissoes_usuarios) tem prioridade sobre o cargo.
create or replace function tem_permissao(p_empresa_id uuid, p_recurso text, p_acao text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_usuario_empresa_id uuid;
  v_cargo_id uuid;
  v_permissao_id uuid;
  v_override boolean;
  v_cargo_permitido boolean;
begin
  if is_superadmin(auth.uid()) then
    return true;
  end if;

  select id, cargo_id into v_usuario_empresa_id, v_cargo_id
  from usuarios_empresas
  where usuario_id = auth.uid() and empresa_id = p_empresa_id and status = 'ativo';

  if v_usuario_empresa_id is null then
    return false;
  end if;

  select id into v_permissao_id from permissoes
  where recurso = p_recurso and acao = p_acao;

  if v_permissao_id is null then
    return false;
  end if;

  select permitido into v_override from permissoes_usuarios
  where usuario_empresa_id = v_usuario_empresa_id and permissao_id = v_permissao_id;

  if v_override is not null then
    return v_override;
  end if;

  select permitido into v_cargo_permitido from permissoes_cargos
  where cargo_id = v_cargo_id and permissao_id = v_permissao_id;

  return coalesce(v_cargo_permitido, false);
end;
$$;

-- Sessao ainda valida? Compara com usuarios_empresas.sessions_valid_since
-- para permitir corte imediato de acesso ao bloquear/desligar um funcionario,
-- mesmo com um JWT ainda nao expirado.
create or replace function sessao_valida(p_empresa_id uuid, p_jwt_issued_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select status = 'ativo' and sessions_valid_since <= p_jwt_issued_at
      from usuarios_empresas
      where usuario_id = auth.uid() and empresa_id = p_empresa_id
    ),
    false
  );
$$;
