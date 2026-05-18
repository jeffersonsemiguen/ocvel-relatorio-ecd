import { supabaseAdmin } from "./supabase-admin.ts";

export function chaveIdempotencia(
  codigoEmpresa: string,
  ano: number,
  periodoCodigo: string
): string {
  return `${codigoEmpresa}|${ano}|${periodoCodigo}`;
}

export async function verificarDuplicidade(chave: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("execucoes_integracao")
    .select("id")
    .eq("chave_idempotencia", chave)
    .in("status", ["sucesso", "em_andamento"])
    .maybeSingle();
  return !!data;
}

export async function registrarExecucao(
  chave: string,
  origem: "webhook" | "manual",
  payload: unknown
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("execucoes_integracao")
    .insert({
      chave_idempotencia: chave,
      status: "em_andamento",
      origem,
      payload_recebido: payload as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function finalizarExecucao(
  id: string,
  status: "sucesso" | "erro",
  resultado?: unknown,
  erro?: string
) {
  await supabaseAdmin
    .from("execucoes_integracao")
    .update({
      status,
      resultado: resultado as Record<string, unknown> | undefined,
      mensagem_erro: erro,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);
}
