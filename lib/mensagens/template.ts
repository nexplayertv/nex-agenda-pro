import { formatarData, formatarMoeda } from "@/lib/utils-domain/masks";

export type VariaveisMensagem = {
  nome_cliente: string;
  nome_empresa: string;
  nome_profissional: string;
  servico: string;
  data: string;
  horario: string;
  valor_total: string;
  valor_entrada: string;
  valor_restante: string;
  endereco: string;
  whatsapp_empresa: string;
};

export function renderizarTemplate(conteudo: string, variaveis: VariaveisMensagem): string {
  return conteudo.replace(/\{(\w+)\}/g, (match, chave: string) => {
    return chave in variaveis ? variaveis[chave as keyof VariaveisMensagem] : match;
  });
}

export function montarVariaveis(params: {
  nomeCliente: string;
  nomeEmpresa: string;
  nomeProfissional: string;
  servico: string;
  data: string;
  horaInicio: string;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  endereco?: string | null;
  whatsappEmpresa?: string | null;
}): VariaveisMensagem {
  return {
    nome_cliente: params.nomeCliente,
    nome_empresa: params.nomeEmpresa,
    nome_profissional: params.nomeProfissional,
    servico: params.servico,
    data: formatarData(params.data),
    horario: params.horaInicio.slice(0, 5),
    valor_total: formatarMoeda(params.valorTotal),
    valor_entrada: formatarMoeda(params.valorEntrada),
    valor_restante: formatarMoeda(params.valorRestante),
    endereco: params.endereco ?? "",
    whatsapp_empresa: params.whatsappEmpresa ?? "",
  };
}
