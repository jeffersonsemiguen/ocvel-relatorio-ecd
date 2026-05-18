import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnexoDownloadButton } from "./AnexoDownloadButton";
import { UploadAnexoDialog } from "./UploadAnexoDialog";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDataPt } from "@/lib/format";
import { useAnexos } from "@/hooks/useAnexos";

interface Props {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
}

const TIPO_LABEL: Record<string, string> = {
  DRE: "DRE",
  BALANCO: "Balanço",
  DMPL: "DMPL",
  DFC: "DFC",
  DRA: "DRA",
  RECIBO_ECD: "Recibo ECD",
  RECIBO_ECF: "Recibo ECF",
};

export function AnexosList({ entidadeTipo, entidadeId }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading } = useAnexos({ entidadeTipo, entidadeId });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Anexos</p>
        <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Enviar
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={2} />
      ) : !data?.length ? (
        <EmptyState title="Nenhum anexo" description="Nenhum arquivo enviado ainda." />
      ) : (
        <div className="space-y-2">
          {data.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium">{TIPO_LABEL[a.tipo_documento] ?? a.tipo_documento}</p>
                <p className="text-xs text-muted-foreground">
                  {a.nome_arquivo} · {formatDataPt(a.criado_em)}
                </p>
              </div>
              <AnexoDownloadButton storagePath={a.storage_path} nomeArquivo={a.nome_arquivo} />
            </div>
          ))}
        </div>
      )}

      <UploadAnexoDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        entidadeTipo={entidadeTipo}
        entidadeId={entidadeId}
      />
    </div>
  );
}
