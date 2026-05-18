import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FechamentoComVersoes } from "@/types/domain";

export function useFechamento(id: string | undefined) {
  return useQuery<FechamentoComVersoes>({
    queryKey: ["fechamento", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fechamentos")
        .select(
          `*, empresa:empresas!inner ( id, codigo_empresa, razao_social, cnpj ),
           versoes:fechamento_versoes ( * )`
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as FechamentoComVersoes;
    },
    staleTime: 30_000,
  });
}
