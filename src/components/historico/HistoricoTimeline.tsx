import { useHistorico } from "@/hooks/useHistorico";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDataPt } from "@/lib/format";
import { ArrowRight } from "lucide-react";

interface Props {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
}

const LABEL: Record<string, string> = {
  zerado: "Zerado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  entregue: "Entregue",
  retificacao_pendente: "Retificação pendente",
  pendente: "Pendente",
  transmitido: "Transmitido",
  retificada: "Retificada",
};

export function HistoricoTimeline({ entidadeTipo, entidadeId }: Props) {
  const { data, isLoading } = useHistorico({ entidadeTipo, entidadeId });

  if (isLoading) return <LoadingSkeleton rows={3} />;
  if (!data?.length) return <p className="text-sm text-muted-foreground">Sem histórico.</p>;

  return (
    <div className="space-y-2">
      {data.map((h) => (
        <div key={h.id} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              {h.status_anterior && (
                <>
                  <span className="text-muted-foreground">
                    {LABEL[h.status_anterior] ?? h.status_anterior}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </>
              )}
              <span className="font-medium">{LABEL[h.status_novo] ?? h.status_novo}</span>
            </div>
            {h.observacao && (
              <p className="mt-1 text-xs text-muted-foreground">{h.observacao}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDataPt(h.criado_em)}
          </p>
        </div>
      ))}
    </div>
  );
}
