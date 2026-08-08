"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LinhaExportacao = {
  data: string;
  tipo: "Receita" | "Despesa";
  categoria: string;
  descricao: string;
  formaPagamento: string;
  valor: number;
};

function escaparCsv(valor: string): string {
  if (valor.includes(";") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function ExportarCsvButton({
  linhas,
  nomeArquivo,
}: {
  linhas: LinhaExportacao[];
  nomeArquivo: string;
}) {
  function exportar() {
    const cabecalho = ["Data", "Tipo", "Categoria", "Descrição", "Forma de pagamento", "Valor"];
    const corpo = linhas.map((l) =>
      [
        l.data,
        l.tipo,
        l.categoria,
        l.descricao,
        l.formaPagamento,
        l.valor.toFixed(2).replace(".", ","),
      ]
        .map((campo) => escaparCsv(String(campo)))
        .join(";")
    );
    // BOM no inicio para o Excel reconhecer acentuacao UTF-8 corretamente.
    const csv = "﻿" + [cabecalho.join(";"), ...corpo].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" disabled={linhas.length === 0} onClick={exportar}>
      <Download />
      Exportar CSV
    </Button>
  );
}
