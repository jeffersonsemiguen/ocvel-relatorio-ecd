import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeclaracaoStatusBadge } from "./DeclaracaoStatusBadge";
import { formatDataPt } from "@/lib/format";
import type { DeclaracaoComEmpresa, StatusDeclaracao } from "@/types/domain";

interface Props {
  declaracao: DeclaracaoComEmpresa;
}

export function DeclaracaoDetailCard({ declaracao }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{declaracao.empresa.razao_social}</CardTitle>
        <p className="text-xs text-muted-foreground">{declaracao.empresa.cnpj}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Tipo</p>
          <p className="font-mono font-bold">{declaracao.tipo_declaracao}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ano</p>
          <p className="font-medium">{declaracao.ano}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <DeclaracaoStatusBadge status={declaracao.status as StatusDeclaracao} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Atualizado em</p>
          <p>{formatDataPt(declaracao.atualizado_em)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
