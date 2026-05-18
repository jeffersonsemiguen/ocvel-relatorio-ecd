import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Empresa } from "@/types/domain";

export function useEmpresas() {
  return useQuery<Empresa[]>({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("ativo", true)
        .order("razao_social");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}
