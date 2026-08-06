# Instalação e configuração

## 1. Pré-requisitos

- Node.js 20.9+ e npm
- Uma conta no [Supabase](https://supabase.com) (grátis para começar)
- Opcional para desenvolvimento local completo (RLS, storage, funções): [Supabase CLI](https://supabase.com/docs/guides/cli) + Docker

## 2. Criar o projeto Supabase

1. Crie um novo projeto em https://supabase.com/dashboard.
2. Em **Project Settings > API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha esta chave no frontend)
3. Em **Authentication > Providers**, deixe **Email** habilitado. Para testar sem precisar configurar SMTP, desative "Confirm email" em **Authentication > Sign In / Providers** durante o desenvolvimento (reative em produção).
4. Em **Authentication > URL Configuration**, adicione `http://localhost:3000/**` (e depois o domínio de produção) em *Redirect URLs*.

## 3. Rodar as migrations

As migrations vivem em `supabase/migrations/` (schema completo: ~40 tabelas, RLS, funções auxiliares) e `supabase/seed/` (dados de demonstração, **não** roda em produção).

### Opção A — projeto remoto, via SQL Editor

Abra cada arquivo de `supabase/migrations/` **na ordem numérica** e rode no SQL Editor do painel do Supabase. Não rode os arquivos de `supabase/seed/` em produção.

### Opção B — Supabase CLI (recomendado)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <seu-project-ref>
supabase db push                # aplica as migrations
# opcional, só em ambiente de teste:
supabase db reset --linked      # aplica migrations + seed de demonstração
```

Para desenvolver 100% local (com Docker):

```bash
supabase start                  # sobe Postgres + Auth + Storage localmente
supabase db reset                # aplica migrations + seed de demonstração
```

## 4. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

- `CREDENTIALS_ENCRYPTION_KEY`: gere com `openssl rand -base64 32`. Usada para criptografar as credenciais do Asaas/Stripe em repouso (`credenciais_gateways`).
- `CRON_SECRET`: qualquer string aleatória. Protege `app/api/cron/expirar-reservas`.
- Variáveis do Asaas/Stripe: ver `docs/asaas.md` e `docs/stripe.md`. Podem ficar vazias enquanto você não ativa esses gateways — o Pix próprio funciona sem elas.

## 5. Instalar dependências e rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`, crie uma conta pela aba "Criar conta" — isso cria automaticamente a empresa, os 5 cargos padrão, os templates de mensagem padrão e uma assinatura em período de teste.

## 6. Dados de demonstração (opcional)

`supabase/seed/0001_empresa_demo.sql` cria uma empresa de exemplo ("Studio Nail Demo") com serviço, profissional e cliente de teste. Ele só roda com `supabase db reset` (ambiente local/dev). Para virar administrador dessa empresa demo, crie sua conta normalmente e rode o bloco SQL comentado no final do arquivo, trocando pelo seu e-mail.

## 7. Cron de expiração de reservas

Reservas temporárias (Pix aguardando comprovante) e horários bloqueados precisam de uma rotina periódica que chama `GET /api/cron/expirar-reservas` com o header `Authorization: Bearer <CRON_SECRET>`. Opções:

- **Vercel Cron** (`vercel.json`):
  ```json
  { "crons": [{ "path": "/api/cron/expirar-reservas", "schedule": "*/5 * * * *" }] }
  ```
  (a Vercel já envia um header de autenticação próprio para crons internos; ajuste a checagem em `route.ts` se for usar esse mecanismo em vez do `CRON_SECRET`)
- **GitHub Actions** com um workflow agendado fazendo `curl`.
- **pg_cron** no próprio Postgres, chamando a função via `net.http_get` (extensão `pg_net`).

## 8. Publicação

O projeto é um app Next.js 16 padrão — funciona em qualquer host que suporte Node.js (Vercel, Railway, um VPS com `next start`). Antes de publicar:

1. Rode as migrations no projeto Supabase de produção (nunca rode `supabase/seed/`).
2. Configure as variáveis de ambiente de produção (não reutilize as chaves do sandbox do Asaas/Stripe).
3. Configure os webhooks do Asaas e da Stripe apontando para o domínio final (`docs/asaas.md`, `docs/stripe.md`).
4. Configure o cron de expiração de reservas.
5. `npm run build && npm run start` para validar localmente antes do deploy.

## 9. PWA

A base já é responsiva mobile-first. O manifest e o service worker (para instalação como app e uso offline básico) estão no roadmap da Fase 2 — ver o plano de arquitetura para o que falta.
