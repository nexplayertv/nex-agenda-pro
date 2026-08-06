export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

// Datas "puras" (YYYY-MM-DD, ex.: agendamentos.data) precisam do T00:00:00
// para não sofrer o deslocamento de fuso do parser do JS. Timestamps
// completos (ex.: created_at, criado_em) já vêm com hora e fuso, então
// NÃO devem levar esse sufixo - concatená-lo geraria uma string invalida.
function paraDate(data: string | Date): Date {
  if (data instanceof Date) return data;
  return data.includes("T") ? new Date(data) : new Date(`${data}T00:00:00`);
}

export function formatarData(data: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(paraDate(data));
}

export function formatarDataHora(data: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    paraDate(data)
  );
}

export function formatarDuracao(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (horas === 0) return `${min}min`;
  if (min === 0) return `${horas}h`;
  return `${horas}h${min}min`;
}
