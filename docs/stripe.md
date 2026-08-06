# Configurar a Stripe

Integração implementada em `lib/payments/stripe.ts` (Checkout Session, consulta de
status, reembolso, teste de conexão) e no webhook `app/api/webhooks/stripe/route.ts`.
A base já está preparada para operar com uma conta **Stripe Connect** (parâmetro
`stripeAccountId` do `StripeGateway`), mas o fluxo de onboarding de contas
conectadas (Stripe Connect Onboarding) fica para uma fase seguinte — hoje a
integração funciona com uma chave secreta da própria conta Stripe da empresa.

## 1. Obter as chaves

1. Crie uma conta em https://dashboard.stripe.com.
2. Em **Developers > API keys**, copie a **Secret key** (`sk_test_...` no modo
   teste, `sk_live_...` em produção).

## 2. Conectar no AgendaPro

1. Acesse **Gateways de pagamento**.
2. No card **Stripe**, escolha o ambiente e cole a chave secreta.
3. Clique em **Conectar / atualizar chave** (fica criptografada em repouso) e depois
   em **Testar conexão**.
4. Opcionalmente, marque a Stripe como **gateway principal**.

## 3. Configurar o webhook

Em **Developers > Webhooks**, no painel da Stripe:

- URL: `https://SEU_DOMINIO/api/webhooks/stripe`
- Evento mínimo: `checkout.session.completed`
- Copie o **Signing secret** (`whsec_...`) gerado e coloque em
  `STRIPE_WEBHOOK_SECRET` no `.env` do servidor.

O endpoint valida a assinatura com `stripe.webhooks.constructEvent` antes de
processar qualquer evento — payloads sem assinatura válida são rejeitados com
`400`.

## 4. Teste local

Use a [Stripe CLI](https://stripe.com/docs/stripe-cli) para encaminhar eventos
para o seu ambiente local:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

A CLI imprime um `whsec_...` temporário — use-o em `STRIPE_WEBHOOK_SECRET`
durante os testes locais.
