"use server";

import { revalidatePath } from "next/cache";
import { getSlotsDisponiveis } from "@/lib/agenda/disponibilidade";
import { createServiceClient } from "@/lib/supabase/service";
import { iniciarReservaSchema } from "@/lib/validations/booking";

export type ReservaState = { error: string | null; agendamentoId?: string; valorEntrada?: number };

export async function buscarSlotsPublicoAction(
  empresaId: string,
  profissionalId: string,
  servicoId: string,
  data: string
): Promise<string[]> {
  const supabase = createServiceClient();
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_minutos")
    .eq("id", servicoId)
    .eq("empresa_id", empresaId)
    .single();

  if (!servico) return [];

  return getSlotsDisponiveis(supabase, {
    empresaId,
    profissionalId,
    data,
    duracaoMinutos: servico.duracao_minutos,
  });
}

export async function criarReservaPublica(
  empresaId: string,
  _prev: ReservaState,
  formData: FormData
): Promise<ReservaState> {
  const parsed = iniciarReservaSchema.safeParse({
    servicoId: formData.get("servicoId"),
    profissionalId: formData.get("profissionalId"),
    data: formData.get("data"),
    horaInicio: formData.get("horaInicio"),
    nomeCliente: formData.get("nomeCliente"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email") ?? "",
    observacoes: formData.get("observacoes") ?? "",
    aceiteTermos: formData.get("aceiteTermos") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const supabase = createServiceClient();
  const {
    servicoId,
    profissionalId,
    data,
    horaInicio,
    nomeCliente,
    whatsapp,
    email,
    observacoes,
  } = parsed.data;

  const [{ data: servico }, { data: config }, { data: gatewayPix }] = await Promise.all([
    supabase.from("servicos").select("valor, duracao_minutos").eq("id", servicoId).single(),
    supabase
      .from("configuracoes_empresas")
      .select("percentual_entrada, prazo_comprovante_minutos")
      .eq("empresa_id", empresaId)
      .single(),
    supabase
      .from("gateways_empresas")
      .select("status")
      .eq("empresa_id", empresaId)
      .eq("tipo", "pix_proprio")
      .maybeSingle(),
  ]);

  if (!servico || !config) return { error: "Serviço não encontrado." };
  if (!gatewayPix || gatewayPix.status !== "ativo") {
    return { error: "Nenhuma forma de pagamento está configurada. Entre em contato com a empresa." };
  }

  const slots = await getSlotsDisponiveis(supabase, {
    empresaId,
    profissionalId,
    data,
    duracaoMinutos: servico.duracao_minutos,
  });
  if (!slots.includes(horaInicio)) {
    return { error: "Esse horário não está mais disponível. Volte e escolha outro." };
  }

  let { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("whatsapp", whatsapp)
    .maybeSingle();

  if (!cliente) {
    const { data: novoCliente, error: erroCliente } = await supabase
      .from("clientes")
      .insert({ empresa_id: empresaId, nome: nomeCliente, whatsapp, email: email || null })
      .select("id")
      .single();
    if (erroCliente || !novoCliente) return { error: "Não foi possível registrar seus dados." };
    cliente = novoCliente;
  }

  const [h, m] = horaInicio.split(":").map(Number);
  const fimMinutos = h * 60 + m + servico.duracao_minutos;
  const horaFim = `${Math.floor(fimMinutos / 60)
    .toString()
    .padStart(2, "0")}:${(fimMinutos % 60).toString().padStart(2, "0")}`;

  const valorTotal = Number(servico.valor);
  const percentual = config.percentual_entrada;
  const valorEntrada = Math.round(valorTotal * (percentual / 100) * 100) / 100;
  const valorRestante = Math.round((valorTotal - valorEntrada) * 100) / 100;

  const { data: agendamento, error: erroAgendamento } = await supabase
    .from("agendamentos")
    .insert({
      empresa_id: empresaId,
      cliente_id: cliente.id,
      servico_id: servicoId,
      profissional_id: profissionalId,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      status: "aguardando_comprovante",
      valor_total: valorTotal,
      percentual_entrada_aplicado: percentual,
      valor_entrada: valorEntrada,
      valor_restante: valorRestante,
      forma_pagamento: "pix_proprio",
      origem: "publico",
      observacoes: observacoes || null,
    })
    .select("id")
    .single();

  if (erroAgendamento || !agendamento) {
    return { error: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário." };
  }

  const expiraEm = new Date(Date.now() + config.prazo_comprovante_minutos * 60_000).toISOString();

  await supabase.from("reservas_temporarias").insert({
    empresa_id: empresaId,
    agendamento_id: agendamento.id,
    expira_em: expiraEm,
    status: "ativa",
  });

  await supabase.from("pagamentos").insert({
    empresa_id: empresaId,
    agendamento_id: agendamento.id,
    tipo: "entrada",
    valor: valorEntrada,
    forma_pagamento: "pix_proprio",
    gateway: "pix_proprio",
    status: "pendente",
  });

  await supabase.from("notificacoes").insert({
    empresa_id: empresaId,
    tipo: "nova_reserva_temporaria",
    titulo: "Nova reserva pelo link público",
    mensagem: `${nomeCliente} reservou ${servico ? "um horário" : ""} para ${data} às ${horaInicio}. Aguardando comprovante Pix.`,
    link: "/pagamentos-entrada",
  });

  revalidatePath("/agenda");
  return { error: null, agendamentoId: agendamento.id, valorEntrada };
}

export async function enviarComprovanteAction(
  agendamentoId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const arquivo = formData.get("comprovante");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione um arquivo." };
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    return { error: "O arquivo deve ter no máximo 5MB." };
  }
  const extensoesPermitidas = ["image/jpeg", "image/png", "application/pdf"];
  if (!extensoesPermitidas.includes(arquivo.type)) {
    return { error: "Envie um arquivo JPG, PNG ou PDF." };
  }

  const supabase = createServiceClient();
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("id, empresa_id, status")
    .eq("id", agendamentoId)
    .single();

  if (!agendamento) return { error: "Agendamento não encontrado." };

  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("id")
    .eq("agendamento_id", agendamentoId)
    .eq("tipo", "entrada")
    .single();

  if (!pagamento) return { error: "Pagamento não encontrado." };

  const extensao = arquivo.name.split(".").pop() ?? "bin";
  const caminho = `${agendamento.empresa_id}/${agendamentoId}/${Date.now()}.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from("comprovantes")
    .upload(caminho, arquivo, { contentType: arquivo.type });

  if (erroUpload) return { error: "Não foi possível enviar o arquivo. Tente novamente." };

  await supabase.from("comprovantes_pagamentos").insert({
    pagamento_id: pagamento.id,
    arquivo_url: caminho,
    status: "enviado",
  });

  await supabase.from("pagamentos").update({ status: "em_analise" }).eq("id", pagamento.id);
  await supabase.from("agendamentos").update({ status: "comprovante_enviado" }).eq("id", agendamentoId);

  await supabase.from("notificacoes").insert({
    empresa_id: agendamento.empresa_id,
    tipo: "comprovante_enviado",
    titulo: "Comprovante recebido",
    mensagem: "Um cliente enviou o comprovante de pagamento e está aguardando confirmação.",
    link: "/pagamentos-entrada",
  });

  revalidatePath("/pagamentos-entrada");
  return { error: null };
}

function normalizarTexto(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function telefonesCorrespondem(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

export type AgendamentoClienteResumo = {
  id: string;
  data: string;
  horaInicio: string;
  status: string;
  servicoNome: string;
  profissionalNome: string;
  valorTotal: number;
  valorEntrada: number;
};

export async function buscarAgendamentosClienteAction(
  empresaSlug: string,
  nomeInformado: string,
  telefoneInformado: string
): Promise<{ error: string | null; agendamentos: AgendamentoClienteResumo[] }> {
  const nome = nomeInformado.trim();
  const digitosInformados = telefoneInformado.replace(/\D/g, "");

  if (nome.length < 2 || digitosInformados.length < 8) {
    return {
      error: "Informe seu nome completo e o telefone usado no agendamento.",
      agendamentos: [],
    };
  }

  const supabase = createServiceClient();
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("slug", empresaSlug)
    .single();

  if (!empresa) return { error: "Empresa não encontrada.", agendamentos: [] };

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome, whatsapp")
    .eq("empresa_id", empresa.id);

  const nomeNormalizado = normalizarTexto(nome);
  const cliente = (clientes ?? []).find(
    (c) =>
      normalizarTexto(c.nome) === nomeNormalizado &&
      telefonesCorrespondem((c.whatsapp ?? "").replace(/\D/g, ""), digitosInformados)
  );

  if (!cliente) {
    return {
      error: "Não encontramos nenhum agendamento com esse nome e telefone.",
      agendamentos: [],
    };
  }

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      "id, data, hora_inicio, status, valor_total, valor_entrada, servicos(nome), profissionais(nome)"
    )
    .eq("empresa_id", empresa.id)
    .eq("cliente_id", cliente.id)
    .order("data", { ascending: false })
    .order("hora_inicio", { ascending: false })
    .limit(20);

  return {
    error: null,
    agendamentos: (agendamentos ?? []).map((a) => ({
      id: a.id,
      data: a.data,
      horaInicio: a.hora_inicio,
      status: a.status,
      servicoNome: (a.servicos as unknown as { nome: string } | null)?.nome ?? "—",
      profissionalNome: (a.profissionais as unknown as { nome: string } | null)?.nome ?? "—",
      valorTotal: Number(a.valor_total),
      valorEntrada: Number(a.valor_entrada),
    })),
  };
}

export async function statusReservaAction(
  agendamentoId: string
): Promise<{ status: string; expiraEm: string | null } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("agendamentos")
    .select("status, reservas_temporarias(expira_em, status)")
    .eq("id", agendamentoId)
    .single();

  if (!data) return null;
  const reserva = data.reservas_temporarias as unknown as
    | { expira_em: string; status: string }[]
    | { expira_em: string; status: string }
    | null;
  const reservaRow = Array.isArray(reserva) ? reserva[0] : reserva;

  return { status: data.status, expiraEm: reservaRow?.expira_em ?? null };
}
