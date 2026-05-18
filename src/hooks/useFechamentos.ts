import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FechamentoComEmpresa, Periodo, StatusFechamento } from "@/types/domain";

interface Filtros {
  ano: number;
  periodo?: Periodo;
  status?: StatusFechamento;
  empresaId?: string;
}

export function useFechamentos(filtros: Filtros) {
  return useQuery<FechamentoComEmpresa[]>({
    queryKey: ["fechamentos", filtros],
    queryFn: async () => {
      let q = supabase
        .from("fechamentos")
        .select(
          `id, ano, periodo, status, origem, criado_em, atualizado_em,
           empresa:empresas!inner ( id, codigo_empresa, razao_social, cnpj )`
        )
        .eq("ano", filtros.ano)
        .order("atualizado_em", { ascending: false });

      if (filtros.periodo) q = q.eq("periodo", filtros.periodo);
      if (filtros.status) q = q.eq("status", filtros.status);
      if (filtros.empresaId) q = q.eq("empresa_id", filtros.empresaId);

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as FechamentoComEmpresa[];
    },
    staleTime: 30_000,
  });
}
