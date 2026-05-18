import { supabaseAdmin } from "./supabase-admin.ts";
import {
  chaveIdempotencia,
  verificarDuplicidade,
  registrarExecucao,
  finalizarExecucao,
} from "./idempotency.ts";

interface FechamentoPayload {
  codigo_empresa: string;
  ano: number;
  periodo_codigo: string;
  arquivos_pdf?: { tipo: string; base64: string; nome: string }[];
  origem: "webhook" | "manual";
}

export async function criarFechamentoComVersaoEAnexos(payload: FechamentoPayload) {
  const chave = chaveIdempotencia(payload.codigo_empresa, payload.ano, payload.periodo_codigo);

  const duplicado = await verificarDuplicidade(chave);
  if (duplicado) return { status: "duplicado", chave };

  const execucaoId = await registrarExecucao(chave, payload.origem, payload);

  try {
    const { data: empresa, error: empError } = await supabaseAdmin
      .from("empresas")
      .select("id")
      .eq("codigo_empresa", payload.codigo_empresa)
      .single();

    if (empError || !empresa) throw new Error(`Empresa não encontrada: ${payload.codigo_empresa}`);

    const { data: fechamento, error: fechError } = await supabaseAdmin
      .from("fechamentos")
      .upsert(
        {
          empresa_id: empresa.id,
          ano: payload.ano,
          periodo: payload.periodo_codigo,
          status: "zerado",
          origem: payload.origem,
        },
        { onConflict: "empresa_id,ano,periodo" }
      )
      .select("id")
      .single();

    if (fechError || !fechamento) throw fechError ?? new Error("Erro ao criar fechamento");

    const { error: versaoError } = await supabaseAdmin
      .from("fechamento_versoes")
      .upsert(
        { fechamento_id: fechamento.id, numero_versao: 0, bloqueada: false },
        { onConflict: "fechamento_id,numero_versao" }
      );

    if (versaoError) throw versaoError;

    await finalizarExecucao(execucaoId, "sucesso", { fechamento_id: fechamento.id });
    return { status: "sucesso", fechamento_id: fechamento.id };
  } catch (err) {
    await finalizarExecucao(execucaoId, "erro", undefined, String(err));
    throw err;
  }
}
