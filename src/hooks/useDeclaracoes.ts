import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DeclaracaoComEmpresa, TipoDeclaracao } from "@/types/domain";

interface Filtros {
  ano: number;
  tipo?: TipoDeclaracao;
  empresaId?: string;
}

export function useDeclaracoes(filtros: Filtros) {
  return useQuery<DeclaracaoComEmpresa[]>({
    queryKey: ["declaracoes", filtros],
    queryFn: async () => {
      let q = supabase
        .from("declaracoes")
        .select(
          `id, ano, tipo_declaracao, status, criado_em, atualizado_em,
           empresa:empresas!inner ( id, codigo_empresa, razao_social, cnpj )`
        )
        .eq("ano", filtros.ano)
        .order("atualizado_em", { ascending: false });

      if (filtros.tipo) q = q.eq("tipo_declaracao", filtros.tipo);
      if (filtros.empresaId) q = q.eq("empresa_id", filtros.empresaId);

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as DeclaracaoComEmpresa[];
    },
    staleTime: 30_000,
  });
}
