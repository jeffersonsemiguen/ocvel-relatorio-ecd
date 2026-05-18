import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDataPt } from "@/lib/format";
import type { FechamentoVersao } from "@/types/domain";

interface Props {
  versoes: FechamentoVersao[];
}

export function FechamentoVersoesList({ versoes }: Props) {
  if (!versoes.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma versão registrada.</p>;
  }

  return (
    <div className="space-y-2">
      {versoes.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {v.bloqueada && <Lock className="h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">
                {v.numero_versao === 0 ? "Original" : `RET${v.numero_versao}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Criado em {formatDataPt(v.criado_em)}
              </p>
            </div>
          </div>
          {v.bloqueada && (
            <Badge variant="secondary" className="text-xs">
              Bloqueada
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
