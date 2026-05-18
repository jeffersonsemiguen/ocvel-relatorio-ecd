import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UpdateStatusParams {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string;
  statusAnterior: string;
  statusNovo: string;
  observacao?: string;
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entidadeTipo,
      entidadeId,
      statusAnterior,
      statusNovo,
      observacao,
    }: UpdateStatusParams) => {
      const tabela = entidadeTipo === "fechamento" ? "fechamentos" : "declaracoes";

      const { error: updateError } = await supabase
        .from(tabela)
        .update({ status: statusNovo, atualizado_em: new Date().toISOString() })
        .eq("id", entidadeId);

      if (updateError) throw updateError;

      const { error: histError } = await supabase
        .from("historico_status")
        .insert({
          entidade_tipo: entidadeTipo,
          entidade_id: entidadeId,
          status_anterior: statusAnterior,
          status_novo: statusNovo,
          observacao: observacao ?? null,
        });

      if (histError) throw histError;
    },
    onSuccess: (_data, { entidadeTipo, entidadeId }) => {
      queryClient.invalidateQueries({ queryKey: [entidadeTipo, entidadeId] });
      queryClient.invalidateQueries({ queryKey: [`${entidadeTipo}s`] });
      queryClient.invalidateQueries({ queryKey: ["historico", entidadeTipo, entidadeId] });
      toast.success("Status atualizado com sucesso.");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    },
  });
}
