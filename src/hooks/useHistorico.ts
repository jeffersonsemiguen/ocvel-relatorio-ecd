import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { HistoricoStatus } from "@/types/domain";

interface Params {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string | undefined;
}

export function useHistorico({ entidadeTipo, entidadeId }: Params) {
  return useQuery<HistoricoStatus[]>({
    queryKey: ["historico", entidadeTipo, entidadeId],
    enabled: !!entidadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_status")
        .select("*")
        .eq("entidade_tipo", entidadeTipo)
        .eq("entidade_id", entidadeId!)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}
