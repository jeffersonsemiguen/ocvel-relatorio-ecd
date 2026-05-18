import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Anexo } from "@/types/domain";

interface Params {
  entidadeTipo: "fechamento" | "declaracao";
  entidadeId: string | undefined;
}

export function useAnexos({ entidadeTipo, entidadeId }: Params) {
  return useQuery<Anexo[]>({
    queryKey: ["anexos", entidadeTipo, entidadeId],
    enabled: !!entidadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anexos")
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
