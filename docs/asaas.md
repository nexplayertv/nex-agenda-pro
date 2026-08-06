# Configurar o Asaas

Integração implementada em `lib/payments/asaas.ts` (cobrança Pix, consulta de status,
reembolso, teste de conexão) e no webhook `app/api/webhooks/asaas/route.ts`.

## 1. Obter a chave de API

1. Crie uma conta em https://www.asaas.com (ou use o sandbox: https://sandbox.asaas.com).
2. No painel, vá em **Integrações > API** e copie a **Chave de API** (`access_token`).
3. Use o ambiente **Sandbox** para testar sem mexer com dinheiro real.

## 2. Conectar no AgendaPro

1. Acesse **Gateways de pagamento** no painel.
2. No card **Asaas**, escolha o ambiente (Sandbox/Produção) e cole a chave de API.
3. Clique em **Conectar / atualizar chave** — a chave é criptografada (AES-256-GCM)
   antes de ser salva; nunca fica acessível pelo navegador.
4. Clique em **Testar conexão** para confirmar que a chave é válida.
5. Se quiser que o Asaas seja o gateway automático usado no link público, clique em
   **Tornar principal** (só um gateway automático — Asaas ou Stripe — pode ser
   principal por vez; o Pix próprio pode continuar ativo em paralelo).

## 3. Configurar o webhook

No painel do Asaas, em **Integrações > Webhooks**:

- URL: `https://SEU_DOMINIO/api/webhooks/asaas`
- Eventos: pelo menos `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`,
  `PAYMENT_DELETED`
- Token de autenticação (opcional, recomendado): defina um valor e coloque o
  mesmo valor em `ASAAS_WEBHOOK_TOKEN` no `.env` do servidor. O endpoint valida
  o header `asaas-access-token` contra esse valor quando ele está configurado.

**Importante:** o pagamento só é considerado aprovado quando o webhook confirma —
nunca pela página de retorno do checkout. Isso está implementado no
`route.ts` do webhook, que atualiza `pagamentos`, `agendamentos` e cria o
lançamento em `receitas` de forma atômica.

## 4. Ambiente sandbox vs. produção

`lib/payments/asaas.ts` usa `ASAAS_API_URL` (padrão: sandbox) quando nenhuma URL
de produção é passada explicitamente. Ao trocar para produção no card do gateway,
o sistema já aponta para `https://api.asaas.com/v3` automaticamente.
