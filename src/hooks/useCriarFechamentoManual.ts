import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Periodo } from "@/types/domain";

interface Params {
  codigoEmpresa: string;
  ano: number;
  periodoCodigo: Periodo;
}

export function useCriarFechamentoManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Params) => {
      const { data, error } = await supabase.functions.invoke("manual-fechamento", {
        body: {
          codigo_empresa: params.codigoEmpresa,
          ano: params.ano,
          periodo_codigo: params.periodoCodigo,
          arquivos_pdf: [],
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Fechamento criado manualmente.");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar fechamento: ${err.message}`);
    },
  });
}
