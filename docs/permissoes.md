# Cargos e permissões

## Modelo

- **Catálogo fixo de permissões** (`permissoes`): pares `recurso` × `ação`
  (`visualizar`, `criar`, `editar`, `excluir`, `confirmar`, `cancelar`,
  `exportar`, `aprovar`, `reembolsar`). Definido em
  `supabase/migrations/0012_permissoes_catalogo.sql` e espelhado em
  `lib/permissions/catalog.ts` no frontend.
- **Cargos** (`cargos`): sempre pertencem a uma empresa. Toda empresa nova recebe
  automaticamente os 5 cargos padrão do escopo (Administrador, Gerente,
  Recepcionista, Profissional, Financeiro) via a função `criar_cargos_padrao`.
  Podem ser editados livremente depois — inclusive criar cargos totalmente novos
  ("Funcionário personalizado").
- **Permissões do cargo** (`permissoes_cargos`): quais permissões um cargo tem
  por padrão.
- **Overrides por usuário** (`permissoes_usuarios`): permitem liberar ou negar
  uma permissão específica para um funcionário, além do que o cargo já dá.
- **Escopo de dados** (`usuarios_empresas.escopo_dados`): `total` (vê tudo da
  empresa) ou `proprio` (só os próprios agendamentos, clientes atendidos e
  comissão) — é assim que um Profissional fica restrito à própria agenda sem
  precisar de uma permissão por registro.

## As três camadas de proteção

Isto é o ponto mais importante do sistema de permissões: **a interface nunca é a
única barreira**.

1. **Row Level Security (Postgres)** — toda tabela do tenant tem policies que
   isolam por `empresa_id`. Isso garante que uma empresa jamais veja dados de
   outra, não importa o que aconteça nas camadas acima.
2. **`requirePermission()` no servidor** — toda Server Action que cria, edita,
   exclui ou confirma algo chama `requirePermission(empresaId, recurso, acao)`
   logo no início (`lib/permissions/require-permission.ts`). Essa função chama a
   **mesma** função SQL (`tem_permissao`) usada pelas policies de RLS, então a
   checagem no servidor nunca diverge do que o banco também vai impor.
3. **`<Can>` / `usePermissions()` no cliente** — esconde botões e itens de menu
   para quem não tem a permissão. É só uma questão de UX: mesmo que alguém
   manipule o HTML ou chame a Server Action diretamente, as camadas 1 e 2 seguem
   bloqueando.

## Adicionar um novo recurso protegido

1. Adicione o par `(recurso, ação)` em
   `supabase/migrations/0012_permissoes_catalogo.sql` (ou uma nova migration, se
   o schema já estiver em produção).
2. Adicione o mesmo recurso em `RECURSOS` (`lib/permissions/catalog.ts`).
3. Decida quais cargos padrão ganham essa permissão em
   `supabase/migrations/0014_cargos_padrao_function.sql`.
4. Chame `requirePermission()` na Server Action correspondente e envolva o botão
   da UI com `<Can recurso="..." acao="...">`.

## Superadministrador

Usuários com `usuarios.tipo = 'superadmin'` (definido diretamente no banco —
não há fluxo de auto-cadastro para isso) passam por cima de toda checagem de
permissão de empresa e enxergam as áreas em `(superadmin)`. Não confunda com
"Administrador" de uma empresa, que é só o cargo padrão com todas as permissões
**daquela empresa**.
