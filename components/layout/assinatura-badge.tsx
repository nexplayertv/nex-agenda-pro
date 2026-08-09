import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatarData } from "@/lib/utils-domain/masks";

export function AssinaturaBadge({
  vencimento,
  diasRestantes,
}: {
  vencimento: string;
  diasRestantes: number;
}) {
  const className =
    diasRestantes <= 2
      ? "bg-destructive/15 text-destructive"
      : diasRestantes <= 7
        ? "bg-amber-500/15 text-amber-500"
        : "bg-muted text-muted-foreground";

  return (
    <Link href="/assinatura">
      <Badge className={`${className} hover:opacity-80`}>
        Vence em {formatarData(vencimento)} · {diasRestantes} dia(s)
      </Badge>
    </Link>
  );
}
