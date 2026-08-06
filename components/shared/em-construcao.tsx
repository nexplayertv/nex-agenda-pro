import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

/**
 * Placeholder para telas do roadmap da Fase 1 ainda nao implementadas
 * neste momento da entrega. Substitua por page.tsx real ao implementar
 * o modulo correspondente do plano.
 */
export function EmConstrucao({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <Construction className="size-8" />
          <p>Esta área está em desenvolvimento e chega em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
