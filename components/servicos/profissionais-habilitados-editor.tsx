"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { salvarProfissionaisServico } from "@/app/(app)/servicos/actions";

export function ProfissionaisHabilitadosEditor({
  servicoId,
  profissionais,
  selecionadosIniciais,
}: {
  servicoId: string;
  profissionais: { id: string; nome: string }[];
  selecionadosIniciais: string[];
}) {
  const [selecionados, setSelecionados] = useState(new Set(selecionadosIniciais));
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  function alternar(id: string, marcado: boolean) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (marcado) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  function salvar() {
    setMensagem(null);
    startTransition(async () => {
      const resultado = await salvarProfissionaisServico(servicoId, Array.from(selecionados));
      setMensagem(resultado.error ?? "Salvo.");
    });
  }

  if (profissionais.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre um profissional primeiro em &quot;Profissionais&quot; para poder habilitá-lo aqui.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {profissionais.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selecionados.has(p.id)}
              onCheckedChange={(checked) => alternar(p.id, !!checked)}
            />
            {p.nome}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={salvar} disabled={pending}>
          {pending ? "Salvando..." : "Salvar profissionais"}
        </Button>
        {mensagem && <p className="text-sm text-muted-foreground">{mensagem}</p>}
      </div>
    </div>
  );
}
