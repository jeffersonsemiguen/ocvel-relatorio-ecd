import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FechamentoStatusBadge } from "./FechamentoStatusBadge";
import { PERIODO_LABEL } from "@/constants/periodos";
import { formatDataPt } from "@/lib/format";
import type { FechamentoComVersoes, Periodo, StatusFechamento } from "@/types/domain";

interface Props {
  fechamento: FechamentoComVersoes;
}

export function FechamentoDetailCard({ fechamento }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{fechamento.empresa.razao_social}</CardTitle>
        <p className="text-xs text-muted-foreground">{fechamento.empresa.cnpj}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Período</p>
          <p className="font-medium">{PERIODO_LABEL[fechamento.periodo as Periodo]}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ano</p>
          <p className="font-medium">{fechamento.ano}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <FechamentoStatusBadge status={fechamento.status as StatusFechamento} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Origem</p>
          <p className="font-medium capitalize">{fechamento.origem}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Criado em</p>
          <p>{formatDataPt(fechamento.criado_em)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Atualizado em</p>
          <p>{formatDataPt(fechamento.atualizado_em)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
