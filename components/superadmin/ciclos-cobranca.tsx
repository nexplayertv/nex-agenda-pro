"use client";

import { useTransition } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/utils-domain/masks";
import { alternarCicloAtivo } from "@/app/(superadmin)/planos/actions";
import { CicloFormDialog, type CicloExistente } from "./ciclo-form-dialog";

export type CicloComStatus = CicloExistente & { ativo: boolean };

export function CiclosCobranca({ ciclos }: { ciclos: CicloComStatus[] }) {
  const [, startTransition] = useTransition();

  return (
    <Card className="max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Ciclos de cobrança</CardTitle>
          <CardDescription>Opções de período que a empresa escolhe ao renovar.</CardDescription>
        </div>
        <CicloFormDialog />
      </CardHeader>
      <CardContent className="space-y-2">
        {ciclos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum ciclo cadastrado ainda.</p>
        )}
        {ciclos.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
            <div>
              <p className="font-medium">{c.nome}</p>
              <p className="text-sm text-muted-foreground">
                {c.periodo_dias} dias · {formatarMoeda(c.valor)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={c.ativo ? "default" : "secondary"}>
                {c.ativo ? "Ativo" : "Inativo"}
              </Badge>
              <CicloFormDialog
                ciclo={c}
                trigger={
                  <Button variant="outline" size="icon-sm">
                    <Pencil />
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => startTransition(() => alternarCicloAtivo(c.id, !c.ativo))}
              >
                {c.ativo ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
