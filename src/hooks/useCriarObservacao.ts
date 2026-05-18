import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Params {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
  conteudo: string;
}

export function useCriarObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entidadeTipo, entidadeId, conteudo }: Params) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("observacoes").insert({
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        conteudo,
        usuario_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { entidadeTipo, entidadeId }) => {
      queryClient.invalidateQueries({
        queryKey: ["observacoes", entidadeTipo, entidadeId],
      });
      toast.success("Observação adicionada.");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar observação: ${err.message}`);
    },
  });
}
