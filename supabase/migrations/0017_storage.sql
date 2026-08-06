-- Bucket privado para comprovantes de pagamento (Pix próprio). Uploads
-- sempre passam por uma Server Action com a service role (o cliente do
-- link público não autentica, então não tem como cumprir uma policy de
-- storage por conta própria) - por isso não há policies de INSERT aqui
-- para "anon". Apenas a equipe autenticada da empresa pode LER os
-- arquivos da própria empresa (path prefixado por empresa_id).

insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', false)
on conflict (id) do nothing;

create policy "comprovantes_select_empresa"
on storage.objects for select
to authenticated
using (
  bucket_id = 'comprovantes'
  and (storage.foldername(name))[1] = (minha_empresa_id())::text
);
