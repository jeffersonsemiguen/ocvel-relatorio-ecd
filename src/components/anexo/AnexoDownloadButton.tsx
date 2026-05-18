import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { toast } from "sonner";

interface Props {
  storagePath: string;
  nomeArquivo?: string | null;
}

export function AnexoDownloadButton({ storagePath, nomeArquivo }: Props) {
  const { mutate, isPending } = useSignedUrl();

  function handleDownload() {
    mutate(storagePath, {
      onSuccess: (url) => window.open(url, "_blank"),
      onError: () => toast.error("Erro ao gerar link de download."),
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-1 hidden sm:inline">{nomeArquivo ?? "Download"}</span>
    </Button>
  );
}
