import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BASE64 = 14_000_000;
const allowedMime = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const { pet_id, pergunta, fileBase64, fileMime, fileName } = await req.json();
    if (!pet_id || typeof pet_id !== "string") return json({ error: "pet_id obrigatório" }, 400);

    const hasText = typeof pergunta === "string" && pergunta.trim().length > 0;
    const hasFile = typeof fileBase64 === "string" && fileBase64.length > 0 && typeof fileMime === "string";
    if (!hasText && !hasFile) return json({ error: "Envie uma pergunta ou arquivo" }, 400);
    if (hasText && pergunta.length > 8000) return json({ error: "Texto muito longo (máx 8000 caracteres)" }, 400);
    if (hasFile && !allowedMime.has(fileMime)) return json({ error: "Formato não suportado" }, 400);
    if (hasFile && fileBase64.length > MAX_BASE64) return json({ error: "Arquivo muito grande (máx ~10MB)" }, 413);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const aiUrl = Deno.env.get("AUTHERA_AI_URL");
    const aiToken = Deno.env.get("AUTHERA_AI_TOKEN");
    if (!supabaseUrl || !anonKey) return json({ error: "Supabase não configurado" }, 500);

    const sb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await sb.auth.getUser();
    if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

    const [petR, vacR, vermR, medR, exameR] = await Promise.all([
      sb.from("pets").select("id,nome,especie,raca,sexo,data_nascimento,peso_kg,status_perdido").eq("id", pet_id).eq("ativo", true).maybeSingle(),
      sb.from("vacinas").select("nome_vacina,data_aplicacao,proxima_data").eq("pet_id", pet_id).order("data_aplicacao", { ascending: false }).limit(10),
      sb.from("vermifugacoes").select("produto,data_aplicacao,proxima_data,dose").eq("pet_id", pet_id).order("data_aplicacao", { ascending: false }).limit(10),
      sb.from("medicamentos").select("nome_medicamento,dosagem,frequencia,data_inicio,data_fim").eq("pet_id", pet_id).order("created_at", { ascending: false }).limit(15),
      sb.from("exames").select("nome_exame,data_exame,observacoes").eq("pet_id", pet_id).order("data_exame", { ascending: false }).limit(10),
    ]);

    if (petR.error) return json({ error: "Falha ao consultar o pet" }, 500);
    if (!petR.data) return json({ error: "Pet não encontrado ou acesso não autorizado" }, 404);

    if (!aiUrl) {
      return json({
        error: "Motor Authera IA ainda não configurado",
        code: "AUTHERA_AI_NOT_CONFIGURED",
      }, 503);
    }

    const aiRes = await fetch(`${aiUrl.replace(/\/$/, "")}/v1/pet/exam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(aiToken ? { Authorization: `Bearer ${aiToken}` } : {}),
      },
      body: JSON.stringify({
        pet_id,
        user_id: userData.user.id,
        pergunta: hasText ? pergunta.trim() : null,
        arquivo: hasFile
          ? { nome: typeof fileName === "string" ? fileName : null, mime: fileMime, base64: fileBase64 }
          : null,
        contexto: {
          pet: petR.data,
          vacinas_recentes: vacR.data || [],
          vermifugacoes_recentes: vermR.data || [],
          medicamentos_recentes: medR.data || [],
          exames_recentes: exameR.data || [],
          data_atual: new Date().toISOString(),
        },
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      console.error("AUTHERA_AI exam error", aiRes.status, detail.slice(0, 500));
      return json({ error: "Motor Authera IA indisponível" }, 502);
    }

    const aiData = await aiRes.json();
    const resposta = typeof aiData?.resposta === "string" ? aiData.resposta : null;
    if (!resposta) return json({ error: "Resposta inválida do motor Authera IA" }, 502);

    return json({ resposta });
  } catch (error) {
    console.error("ia-exame error", error);
    return json({ error: "Erro interno ao analisar exame" }, 500);
  }
});
