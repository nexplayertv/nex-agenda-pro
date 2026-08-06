# AgendaPro

SaaS multiempresa de gestão de serviços, agenda, clientes, funcionários,
pagamentos e financeiro. Nasce para manicures e nail designers, mas a
estrutura é genérica para qualquer prestador de serviço (cabeleireiros,
barbearias, esteticistas, clínicas, personal trainers, fotógrafos, etc.).

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui
(Base UI) · Supabase (Postgres, Auth, Storage, RLS) · Zod · recharts.

## Começando

Veja **`docs/setup.md`** para o passo a passo completo (criar o projeto
Supabase, rodar as migrations, variáveis de ambiente). Resumo:

```bash
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm install
npm run dev
```

## Documentação

| Arquivo | Conteúdo |
|---|---|
| `docs/setup.md` | Instalação, migrations, variáveis de ambiente, deploy, cron |
| `docs/permissoes.md` | Como funcionam cargos, permissões e as 3 camadas de proteção |
| `docs/funcionarios.md` | Convidar, bloquear, desligar funcionários |
| `docs/pix.md` | Fluxo completo do Pix próprio (link público → confirmação manual) |
| `docs/asaas.md` | Conectar o gateway Asaas e configurar o webhook |
| `docs/stripe.md` | Conectar a Stripe e configurar o webhook |

## Estrutura do projeto

```
app/
  (public)/    login, cadastro, recuperação de senha, convite de funcionário,
               catálogo + agendamento público (/agendar/[empresaSlug])
  (app)/       painel autenticado da empresa (dashboard, agenda, clientes,
               serviços, profissionais, funcionários, pagamentos, gateways,
               financeiro, comissões, mensagens, notificações, configurações)
  (superadmin)/ painel do dono da plataforma (empresas, planos, assinaturas)
  api/         webhooks (Asaas, Stripe) e o cron de expiração de reservas
components/    componentes de UI, organizados por módulo + components/ui (shadcn)
lib/           Supabase clients, permissões, pagamentos, validações (Zod)
supabase/
  migrations/  schema completo (SQL), versionado e numerado
  seed/        dados de demonstração (NUNCA rodar em produção)
docs/          este índice
```

## Segurança e isolamento multiempresa

- Row Level Security em todas as tabelas do tenant — nenhuma empresa acessa
  dados de outra, independente de bugs na aplicação.
- Toda ação sensível é validada no servidor com `requirePermission()`, que usa
  a mesma função SQL que o RLS — nunca só a interface decide o que é permitido.
- Credenciais de gateway de pagamento são criptografadas em repouso e nunca
  chegam ao navegador.
- Pagamentos automáticos (Asaas/Stripe) só são confirmados via webhook
  assinado — nunca pela página de retorno do checkout.

Mais detalhes em `docs/permissoes.md`.
