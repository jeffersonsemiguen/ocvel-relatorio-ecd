import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FechamentoStatusBadge } from "./FechamentoStatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PERIODO_LABEL } from "@/constants/periodos";
import { formatDataPt } from "@/lib/format";
import { useFechamentos } from "@/hooks/useFechamentos";
import type { Periodo, StatusFechamento } from "@/types/domain";

interface Props {
  ano: number;
  periodo?: Periodo;
  status?: StatusFechamento;
}

export function FechamentosTable({ ano, periodo, status }: Props) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useFechamentos({ ano, periodo, status });

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.length) return <EmptyState title="Nenhum fechamento encontrado" description="Não há fechamentos para os filtros selecionados." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>CNPJ</TableHead>
          <TableHead>Período</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Atualizado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((f) => (
          <TableRow
            key={f.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/fechamentos/${f.id}`)}
          >
            <TableCell className="font-medium">{f.empresa.razao_social}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{f.empresa.cnpj}</TableCell>
            <TableCell>{PERIODO_LABEL[f.periodo as Periodo]}</TableCell>
            <TableCell>
              <FechamentoStatusBadge status={f.status as StatusFechamento} />
            </TableCell>
            <TableCell className="text-xs capitalize">{f.origem}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDataPt(f.atualizado_em)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
