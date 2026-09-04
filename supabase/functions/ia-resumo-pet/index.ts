import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { pet_id } = await req.json();
    if (!pet_id || typeof pet_id !== "string") return json({ error: "pet_id obrigatório" }, 400);

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

    const [petR, vacR, vermR, medR, exameR, eventR] = await Promise.all([
      sb.from("pets").select("id,nome,especie,raca,sexo,data_nascimento,peso_kg,status_perdido,perdido_desde").eq("id", pet_id).eq("ativo", true).maybeSingle(),
      sb.from("vacinas").select("nome_vacina,data_aplicacao,proxima_data,observacoes").eq("pet_id", pet_id).order("data_aplicacao", { ascending: false }).limit(20),
      sb.from("vermifugacoes").select("produto,data_aplicacao,proxima_data,dose,observacoes").eq("pet_id", pet_id).order("data_aplicacao", { ascending: false }).limit(20),
      sb.from("medicamentos").select("nome_medicamento,dosagem,frequencia,horario,data_inicio,data_fim,observacoes").eq("pet_id", pet_id).order("created_at", { ascending: false }).limit(30),
      sb.from("exames").select("nome_exame,data_exame,observacoes").eq("pet_id", pet_id).order("data_exame", { ascending: false }).limit(20),
      sb.from("pet_eventos").select("tipo_evento,titulo,descricao,dados_json,created_at").eq("pet_id", pet_id).order("created_at", { ascending: false }).limit(50),
    ]);

    if (petR.error) return json({ error: "Falha ao consultar o pet" }, 500);
    if (!petR.data) return json({ error: "Pet não encontrado ou acesso não autorizado" }, 404);

    await sb.from("ai_usage_events").insert({ user_id: userData.user.id, pet_id, feature: "summary", status: "requested" });

    if (!aiUrl) return json({ error: "Motor Authera IA ainda não configurado", code: "AUTHERA_AI_NOT_CONFIGURED" }, 503);

    const contexto = {
      pet: petR.data,
      vacinas: vacR.data || [],
      vermifugacoes: vermR.data || [],
      medicamentos: medR.data || [],
      exames: exameR.data || [],
      eventos_recentes: eventR.data || [],
      data_atual: new Date().toISOString(),
    };

    const aiRes = await fetch(`${aiUrl.replace(/\/$/, "")}/v1/pet/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(aiToken ? { Authorization: `Bearer ${aiToken}` } : {}) },
      body: JSON.stringify({ pet_id, user_id: userData.user.id, contexto }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      console.error("AUTHERA_AI summary error", aiRes.status, detail.slice(0, 500));
      await sb.from("ai_usage_events").insert({ user_id: userData.user.id, pet_id, feature: "summary", status: "error" });
      return json({ error: "Motor Authera IA indisponível" }, 502);
    }

    const aiData = await aiRes.json();
    const score = ["verde", "amarelo", "vermelho"].includes(aiData?.score_saude) ? aiData.score_saude : "amarelo";
    const resumo = typeof aiData?.resumo === "string" ? aiData.resumo : "Resumo indisponível.";
    const alertas = Array.isArray(aiData?.alertas) ? aiData.alertas.slice(0, 20) : [];
    const recomendacoes = Array.isArray(aiData?.recomendacoes) ? aiData.recomendacoes.slice(0, 20) : [];

    const { data: salvo, error: saveError } = await sb
      .from("pet_resumos_ia")
      .insert({ pet_id, resumo, score_saude: score, alertas, recomendacoes })
      .select("id,resumo,score_saude,alertas,recomendacoes,created_at")
      .maybeSingle();

    if (saveError) {
      console.error("pet_resumos_ia insert error", saveError.message);
      await sb.from("ai_usage_events").insert({ user_id: userData.user.id, pet_id, feature: "summary", status: "error" });
      return json({ error: "Análise gerada, mas não foi possível salvar o resumo" }, 500);
    }

    await sb.from("ai_usage_events").insert({ user_id: userData.user.id, pet_id, feature: "summary", status: "success" });
    return json({ resumo: salvo });
  } catch (error) {
    console.error("ia-resumo-pet error", error);
    return json({ error: "Erro interno ao gerar análise" }, 500);
  }
});
