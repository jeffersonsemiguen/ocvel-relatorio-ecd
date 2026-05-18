import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DeclaracaoComEmpresa, DeclaracaoVersao } from "@/types/domain";

interface DeclaracaoDetalhe extends DeclaracaoComEmpresa {
  versoes: DeclaracaoVersao[];
}

export function useDeclaracao(id: string | undefined) {
  return useQuery<DeclaracaoDetalhe>({
    queryKey: ["declaracao", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("declaracoes")
        .select(
          `*, empresa:empresas!inner ( id, codigo_empresa, razao_social, cnpj ),
           versoes:declaracao_versoes ( * )`
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as DeclaracaoDetalhe;
    },
    staleTime: 30_000,
  });
}
