import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FechamentoDetailCard } from "@/components/fechamento/FechamentoDetailCard";
import { FechamentoVersoesList } from "@/components/fechamento/FechamentoVersoesList";
import { MudarStatusDialog } from "@/components/fechamento/MudarStatusDialog";
import { AnexosList } from "@/components/anexo/AnexosList";
import { ObservacoesList } from "@/components/observacao/ObservacoesList";
import { HistoricoTimeline } from "@/components/historico/HistoricoTimeline";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useFechamento } from "@/hooks/useFechamento";
import type { StatusFechamento } from "@/types/domain";

export function FechamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useFechamento(id);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Detalhe do fechamento</h1>
      </div>

      <FechamentoDetailCard fechamento={data} />

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setStatusDialogOpen(true)}>
          Alterar status
        </Button>
      </div>

      <Tabs defaultValue="versoes">
        <TabsList>
          <TabsTrigger value="versoes">Versões</TabsTrigger>
          <TabsTrigger value="anexos">Anexos</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="versoes" className="pt-4">
          <FechamentoVersoesList versoes={data.versoes ?? []} />
        </TabsContent>
        <TabsContent value="anexos" className="pt-4">
          <AnexosList entidadeTipo="fechamento" entidadeId={data.id} />
        </TabsContent>
        <TabsContent value="observacoes" className="pt-4">
          <ObservacoesList entidadeTipo="fechamento" entidadeId={data.id} />
        </TabsContent>
        <TabsContent value="historico" className="pt-4">
          <HistoricoTimeline entidadeTipo="fechamento" entidadeId={data.id} />
        </TabsContent>
      </Tabs>

      <MudarStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        fechamentoId={data.id}
        statusAtual={data.status as StatusFechamento}
      />
    </div>
  );
}
