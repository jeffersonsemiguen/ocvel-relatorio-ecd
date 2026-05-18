import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Observacao } from "@/types/domain";

interface Params {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string | undefined;
}

export function useObservacoes({ entidadeTipo, entidadeId }: Params) {
  return useQuery<Observacao[]>({
    queryKey: ["observacoes", entidadeTipo, entidadeId],
    enabled: !!entidadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observacoes")
        .select("*")
        .eq("entidade_tipo", entidadeTipo)
        .eq("entidade_id", entidadeId!)
        .eq("ativo", true)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}
