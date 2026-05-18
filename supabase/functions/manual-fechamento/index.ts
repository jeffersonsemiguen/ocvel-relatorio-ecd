import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { criarFechamentoComVersaoEAnexos } from "../_shared/fechamento-creator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    if (!payload.codigo_empresa || !payload.ano || !payload.periodo_codigo) {
      return Response.json(
        { error: "Campos obrigatórios: codigo_empresa, ano, periodo_codigo" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await criarFechamentoComVersaoEAnexos({
      ...payload,
      origem: "manual",
    });

    return Response.json(result, { headers: corsHeaders });
  } catch (err) {
    return Response.json(
      { error: String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
});
