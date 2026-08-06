-- Extensoes e utilitarios compartilhados por todas as migrations seguintes.

create extension if not exists "pgcrypto";
-- Necessaria para o exclusion constraint que impede sobreposicao de
-- horarios na agenda de um mesmo profissional (ver 0006).
create extension if not exists "btree_gist";

-- Mantem updated_at sincronizado em qualquer tabela que tenha a coluna.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
