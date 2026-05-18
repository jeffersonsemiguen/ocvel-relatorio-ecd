import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeclaracaoStatusBadge } from "./DeclaracaoStatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { formatDataPt } from "@/lib/format";
import { useDeclaracoes } from "@/hooks/useDeclaracoes";
import type { StatusDeclaracao, TipoDeclaracao } from "@/types/domain";

interface Props {
  ano: number;
  tipo?: TipoDeclaracao;
}

export function DeclaracoesTable({ ano, tipo }: Props) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useDeclaracoes({ ano, tipo });

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.length) return (
    <EmptyState
      title="Nenhuma declaração encontrada"
      description="Não há declarações para o ano selecionado."
    />
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>CNPJ</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Atualizado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((d) => (
          <TableRow
            key={d.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/declaracoes/${d.id}`)}
          >
            <TableCell className="font-medium">{d.empresa.razao_social}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{d.empresa.cnpj}</TableCell>
            <TableCell>
              <span className="font-mono text-xs font-bold">{d.tipo_declaracao}</span>
            </TableCell>
            <TableCell>
              <DeclaracaoStatusBadge status={d.status as StatusDeclaracao} />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDataPt(d.atualizado_em)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
