# Cadastrar funcionários e conceder acesso

## 1. Convidar um funcionário

1. Acesse **Funcionários > Convidar funcionário**.
2. Preencha nome, e-mail, telefone (opcional), o **cargo** e, se ele for também
   um profissional que atende (ex.: uma manicure), o **profissional vinculado**.
3. Ao enviar, o sistema:
   - Cria a linha em `funcionarios` com status `convidado`.
   - Cria um convite em `convites_funcionarios` com um token único válido por 7
     dias.
   - Chama `supabase.auth.admin.inviteUserByEmail`, que envia um e-mail de
     convite **se o projeto Supabase tiver SMTP configurado**
     (Authentication > Email Templates / SMTP Settings no painel do Supabase).

Sem SMTP configurado, o convite continua sendo criado normalmente — use
**Reenviar convite** no menu do funcionário para copiar o link
(`/convite/<token>`) e enviar manualmente por WhatsApp, por exemplo.

## 2. O que o funcionário vê

Ao abrir o link do convite, ele:

1. É autenticado automaticamente (o Supabase troca o código do link por uma
   sessão).
2. Define uma senha.
3. O sistema vincula esse usuário à empresa com o cargo definido no convite
   (função `aceitar_convite_funcionario` no banco, que valida o token, a
   expiração e se o e-mail bate com o do convite antes de liberar o acesso).

## 3. Bloquear, reativar e desligar

No menu de cada funcionário ativo:

- **Bloquear acesso**: corta o acesso imediatamente. Tecnicamente, isso zera
  `usuarios_empresas.sessions_valid_since` — toda consulta feita pelo funcionário
  (via RLS) passa a exigir uma sessão emitida *depois* desse instante, então
  mesmo um token ainda válido para de funcionar na prática.
- **Reativar acesso**: volta o status para ativo.
- **Desligar**: mesmo efeito de bloquear, mas marca como desligamento definitivo.
  Se o funcionário tiver um profissional vinculado com agendamentos futuros, o
  sistema mostra quantos são e oferece a opção de transferi-los para outro
  profissional antes de confirmar.
- **Histórico de atividades**: mostra as últimas ações desse usuário
  (`logs_atividades`) — login, criação/edição/exclusão de registros, confirmações
  de pagamento, etc.

Em nenhum desses casos os registros já existentes (agendamentos, comissões,
pagamentos confirmados, logs) são apagados — apenas o acesso é revogado.

## 4. Redefinir senha

**Redefinir senha** (disponível para funcionários ativos) dispara um e-mail de
recuperação de senha padrão do Supabase Auth para o e-mail cadastrado.
