// Gera o payload EMV ("Pix Copia e Cola") a partir da chave Pix própria
// da empresa. Implementação do padrão BR Code do Banco Central - ver
// https://www.bcb.gov.br/estabilidadefinanceira/pix (Manual de Padrões para Iniciação do Pix).

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function normalizar(texto: string, max: number): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max)
    .toUpperCase();
}

function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPixCopiaECola(params: {
  chave: string;
  nomeTitular: string;
  cidade: string;
  valor?: number;
  identificador?: string;
  descricao?: string;
}): string {
  const merchantAccountInfo =
    tlv("00", "br.gov.bcb.pix") +
    tlv("01", params.chave) +
    (params.descricao ? tlv("02", normalizar(params.descricao, 40)) : "");

  const additionalData = tlv("05", normalizar(params.identificador || "***", 25) || "***");

  let payload =
    tlv("00", "01") +
    tlv("26", merchantAccountInfo) +
    tlv("52", "0000") +
    tlv("53", "986") +
    (params.valor ? tlv("54", params.valor.toFixed(2)) : "") +
    tlv("58", "BR") +
    tlv("59", normalizar(params.nomeTitular, 25) || "RECEBEDOR") +
    tlv("60", normalizar(params.cidade, 15) || "BRASIL") +
    tlv("62", additionalData);

  payload += "6304";
  return payload + crc16ccitt(payload);
}
