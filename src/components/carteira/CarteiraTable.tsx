import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useEmpresas } from "@/hooks/useEmpresas";

export function CarteiraTable() {
  const { data, isLoading, isError, refetch } = useEmpresas();

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.length) return (
    <EmptyState
      title="Sem empresas na sua carteira"
      description="Entre em contato com o administrador para adicionar empresas."
    />
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>CNPJ</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Regime</TableHead>
          <TableHead>Situação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">{e.razao_social}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{e.cnpj}</TableCell>
            <TableCell className="font-mono text-xs">{e.codigo_empresa}</TableCell>
            <TableCell className="text-xs capitalize">
              {e.regime_tributario.replace(/_/g, " ")}
            </TableCell>
            <TableCell>
              <Badge variant={e.ativo ? "default" : "secondary"}>
                {e.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
