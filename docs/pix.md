# Pix próprio (chave da empresa)

Forma de pagamento que não depende de nenhum gateway externo: o cliente paga
direto na chave Pix cadastrada pela empresa, e um usuário autorizado confirma
manualmente o recebimento.

## 1. Cadastrar a chave

1. Acesse **Gateways de pagamento**.
2. No card **Pix próprio**, preencha: tipo e valor da chave, nome do titular,
   banco, cidade do recebedor, tipo de conta, mensagem de orientação (opcional) e
   os prazos (tempo para pagar / tempo para enviar o comprovante).
3. Ao salvar, o gateway é automaticamente marcado como **ativo** — isso já libera
   o Pix próprio como forma de pagamento no link público de agendamento
   (`/agendar/[slug-da-empresa]`).

## 2. Fluxo do cliente (link público)

1. O cliente escolhe serviço, profissional e horário.
2. Ao confirmar seus dados, o sistema cria uma **reserva temporária**
   (`reservas_temporarias`, expira em `prazo_comprovante_minutos`) e o agendamento
   fica com status `aguardando_comprovante`.
3. A tela mostra a chave Pix, o nome do titular, o banco, um **código "Pix Copia e
   Cola"** gerado no padrão EMV do Banco Central (`lib/payments/pix-brcode.ts`) e o
   QR Code correspondente.
4. Depois de pagar, o cliente anexa o comprovante (JPG, PNG ou PDF, até 5MB). O
   arquivo é enviado para o bucket privado `comprovantes` do Supabase Storage.
5. O agendamento muda para `comprovante_enviado` e a tela do cliente passa a
   consultar o status a cada 15s, mostrando a confirmação automaticamente assim
   que a empresa aprovar.

## 3. Confirmação manual (equipe)

Em **Pagamentos de entrada**, todo pagamento com comprovante enviado aparece com
os botões:

- **Confirmar**: marca o pagamento como pago, o agendamento como `confirmado`,
  bloqueia o horário definitivamente e cria o lançamento em **Financeiro**.
- **Recusar**: pede um motivo, volta o agendamento para `aguardando_comprovante`
  e permite que o cliente envie um novo comprovante dentro do prazo.

O comprovante em si só pode ser visualizado pela equipe autenticada da própria
empresa — a política de Storage restringe a leitura ao prefixo `empresa_id/...`
do arquivo (ver `supabase/migrations/0017_storage.sql`).

## 4. Expiração

Uma rotina (`app/api/cron/expirar-reservas`, ver `docs/setup.md` seção 7) libera
automaticamente reservas cujo prazo expirou sem comprovante: o agendamento vira
`cancelado`, o pagamento (se existir) vira `expirado` e uma notificação interna é
criada.
