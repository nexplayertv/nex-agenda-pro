# Configurar o Mercado Pago

Integração implementada em `lib/payments/mercadopago.ts` (cobrança Pix, consulta de
status, reembolso, teste de conexão) e no webhook `app/api/webhooks/mercadopago/route.ts`.

## 1. Obter o Access Token

1. Crie uma conta em https://www.mercadopago.com.br (ou use uma conta de teste, ver
   abaixo).
2. No painel de desenvolvedores (https://www.mercadopago.com.br/developers/panel),
   vá em **Suas integrações** → crie ou selecione uma aplicação → **Credenciais de
   produção** ou **Credenciais de teste**.
3. Copie o **Access Token** (começa com `APP_USR-` em produção ou `TEST-` em teste).

## 2. Conectar no AgendaPro

1. Acesse **Gateways de pagamento** no painel.
2. No card **Mercado Pago**, cole o Access Token.
3. Clique em **Conectar / atualizar chave** — o token é criptografado (AES-256-GCM)
   antes de ser salvo; nunca fica acessível pelo navegador.
4. Clique em **Testar conexão** para confirmar que o token é válido.
5. Clique em **Tornar principal** para que o Mercado Pago passe a ser o gateway usado
   no link público (só um gateway automático — Asaas, Stripe ou Mercado Pago — pode
   ser principal por vez; o Pix próprio fica em segundo plano enquanto houver um
   gateway automático principal ativo).

Assim que estiver principal, o cliente que agendar pelo link público vai ver um QR
Code Pix gerado na hora pelo Mercado Pago, e o agendamento confirma sozinho assim
que o pagamento é identificado — sem upload de comprovante nem confirmação manual.

## 3. Configurar o webhook (recomendado)

No painel de desenvolvedores, na aplicação usada, em **Webhooks**:

- URL: `https://SEU_DOMINIO/api/webhooks/mercadopago`
- Evento: `Pagamentos`
- Copie a **Chave secreta** (assinatura) mostrada ali e coloque em
  `MERCADOPAGO_WEBHOOK_SECRET` no `.env` do servidor. O endpoint valida o header
  `x-signature` contra esse valor quando ele está configurado; sem ele, o webhook
  ainda funciona, mas sem essa camada extra de verificação.

**Importante:** o pagamento só é considerado aprovado depois que o webhook chega E o
servidor confirma o status direto na API do Mercado Pago (nunca só pelo conteúdo do
webhook em si) — isso está implementado no `route.ts` do webhook.

## 4. Contas de teste

Para testar sem dinheiro real, crie contas de teste (comprador e vendedor) em
**Suas integrações** → **Contas de teste**, e use o Access Token de teste (`TEST-...`)
da conta vendedora no AgendaPro.
