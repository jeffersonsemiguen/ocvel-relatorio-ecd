import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeclaracaoDetailCard } from "@/components/declaracao/DeclaracaoDetailCard";
import { AnexosList } from "@/components/anexo/AnexosList";
import { ObservacoesList } from "@/components/observacao/ObservacoesList";
import { HistoricoTimeline } from "@/components/historico/HistoricoTimeline";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useDeclaracao } from "@/hooks/useDeclaracao";
import type { DeclaracaoComEmpresa } from "@/types/domain";

export function DeclaracaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDeclaracao(id);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Detalhe da declaração</h1>
      </div>

      <DeclaracaoDetailCard declaracao={data as DeclaracaoComEmpresa} />

      <Tabs defaultValue="anexos">
        <TabsList>
          <TabsTrigger value="anexos">Anexos</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="anexos" className="pt-4">
          <AnexosList entidadeTipo="declaracao" entidadeId={data.id} />
        </TabsContent>
        <TabsContent value="observacoes" className="pt-4">
          <ObservacoesList entidadeTipo="declaracao" entidadeId={data.id} />
        </TabsContent>
        <TabsContent value="historico" className="pt-4">
          <HistoricoTimeline entidadeTipo="declaracao" entidadeId={data.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
