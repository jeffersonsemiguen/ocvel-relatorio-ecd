import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCriarObservacao } from "@/hooks/useCriarObservacao";

interface Props {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
}

export function ObservacaoForm({ entidadeTipo, entidadeId }: Props) {
  const [conteudo, setConteudo] = useState("");
  const { mutate, isPending } = useCriarObservacao();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!conteudo.trim()) return;
    mutate(
      { entidadeTipo, entidadeId, conteudo },
      { onSuccess: () => setConteudo("") }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        placeholder="Adicione uma observação..."
        rows={3}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!conteudo.trim() || isPending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
