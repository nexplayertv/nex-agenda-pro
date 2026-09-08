"use client";

import Image from "next/image";
import { Star, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarDuracao, formatarMoeda } from "@/lib/utils-domain/masks";
import { ServicoAcoes } from "./servico-acoes";
import type { CategoriaOpcao, ServicoLinha } from "./servico-form-dialog";

export function ServicosTable({
  servicos,
  categorias,
  profissionais,
}: {
  servicos: ServicoLinha[];
  categorias: CategoriaOpcao[];
  profissionais: { id: string; nome: string }[];
}) {
  function acoes(servico: ServicoLinha) {
    return <ServicoAcoes servico={servico} categorias={categorias} profissionais={profissionais} />;
  }

  if (servicos.length === 0) {
    return (
      <div className="rounded-lg border py-10 text-center text-muted-foreground">
        Nenhum serviço cadastrado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Catálogo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map((servico) => (
              <TableRow key={servico.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {servico.foto_url && (
                      <Image
                        src={servico.foto_url}
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="flex items-center gap-1.5 font-medium">
                      {servico.destaque && (
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      )}
                      {servico.nome}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{servico.categorias_servicos?.nome ?? "—"}</TableCell>
                <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                <TableCell>{formatarDuracao(servico.duracao_minutos)}</TableCell>
                <TableCell>
                  {servico.visivel_catalogo ? (
                    <Badge variant="outline">Visível</Badge>
                  ) : (
                    <Badge variant="secondary">
                      <EyeOff className="size-3" /> Oculto
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={servico.status === "ativo" ? "default" : "secondary"}>
                    {servico.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>{acoes(servico)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {servicos.map((servico) => (
          <div key={servico.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {servico.foto_url && (
                  <Image
                    src={servico.foto_url}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="flex min-w-0 items-center gap-1.5 font-medium">
                  {servico.destaque && (
                    <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  )}
                  <span className="truncate">{servico.nome}</span>
                </div>
              </div>
              {acoes(servico)}
            </div>
            <p className="text-sm text-muted-foreground">
              {servico.categorias_servicos?.nome ?? "Sem categoria"} ·{" "}
              {formatarMoeda(servico.valor)} · {formatarDuracao(servico.duracao_minutos)}
            </p>
            <div className="flex flex-wrap gap-2">
              {servico.visivel_catalogo ? (
                <Badge variant="outline">Visível</Badge>
              ) : (
                <Badge variant="secondary">
                  <EyeOff className="size-3" /> Oculto
                </Badge>
              )}
              <Badge variant={servico.status === "ativo" ? "default" : "secondary"}>
                {servico.status === "ativo" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
