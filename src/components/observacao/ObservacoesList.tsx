import { useObservacoes } from "@/hooks/useObservacoes";
import { ObservacaoForm } from "./ObservacaoForm";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDataPt } from "@/lib/format";

interface Props {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
}

export function ObservacoesList({ entidadeTipo, entidadeId }: Props) {
  const { data, isLoading } = useObservacoes({ entidadeTipo, entidadeId });

  return (
    <div className="space-y-4">
      <ObservacaoForm entidadeTipo={entidadeTipo} entidadeId={entidadeId} />
      {isLoading ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className="space-y-2">
          {data?.map((obs) => (
            <div key={obs.id} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-sm">{obs.conteudo}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDataPt(obs.criado_em)}
              </p>
            </div>
          ))}
          {!data?.length && (
            <p className="text-sm text-muted-foreground">Nenhuma observação ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
