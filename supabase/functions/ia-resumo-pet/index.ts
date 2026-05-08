// supabase/functions/ia-resumo-pet/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente veterinário virtual especializado em acompanhamento contínuo de pets.

Analise o histórico completo do pet e gere uma resposta em JSON com a seguinte estrutura:
{
  "resumo": "texto explicando a saúde geral do pet em linguagem simples (3-5 frases)",
  "score_saude": "verde" | "amarelo" | "vermelho",
  "alertas": ["alerta 1", "alerta 2"],
  "recomendacoes": ["recomendação 1", "recomendação 2"]
}

Critérios para o score:
- verde: tudo em dia, sem alertas críticos
- amarelo: alguma atenção (vacina próxima do vencimento, leve variação de peso)
- vermelho: vacinas atrasadas, perda significativa de peso, status perdido, exames recentes preocupantes

REGRAS:
- nunca dar diagnóstico definitivo
- nunca receitar medicamentos
- usar linguagem simples e educativa
- recomendar veterinário quando necessário
- sempre incluir a frase "⚠️ Este assistente não substitui um veterinário." no final do resumo
- responder APENAS com o JSON, sem markdown, sem texto extra`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pet_id } = await req.json();
    if (!pet_id) {
      return new Response(JSON.stringify({ error: "pet_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    const [petR, vacR, medR, exameR, eventR, locR] = await Promise.all([
      sb.from("pets").select("*").eq("id", pet_id).maybeSingle(),
      sb.from("vacinas").select("*").eq("pet_id", pet_id).order("data_aplicacao", { ascending: false }),
      sb.from("medicamentos").select("*").eq("pet_id", pet_id).order("created_at", { ascending: false }),
      sb.from("exames").select("*").eq("pet_id", pet_id).order("data_exame", { ascending: false }),
      sb.from("pet_eventos").select("*").eq("pet_id", pet_id).order("created_at", { ascending: false }).limit(50),
      sb.from("pet_localizacoes").select("*").eq("pet_id", pet_id).order("data_leitura", { ascending: false }).limit(10),
    ]);

    const pet = petR.data;
    if (!pet) {
      return new Response(JSON.stringify({ error: "Pet não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contexto = {
      pet: {
        nome: pet.nome_pet,
        nascimento: pet.data_nascimento,
        peso_atual: pet.peso,
        status_perdido: pet.status_perdido,
        data_perdido: pet.data_perdido,
      },
      vacinas: vacR.data || [],
      medicamentos: medR.data || [],
      exames: exameR.data || [],
      localizacoes_recentes: locR.data || [],
      eventos_recentes: eventR.data || [],
      data_atual: new Date().toISOString(),
    };

    const userMsg = `Histórico do pet (JSON):\n${JSON.stringify(contexto)}\n\nGere a análise no formato JSON solicitado.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione fundos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const raw: string = aiData.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { resumo: raw, score_saude: "verde", alertas: [], recomendacoes: [] };
    }

    const score = ["verde", "amarelo", "vermelho"].includes(parsed.score_saude) ? parsed.score_saude : "verde";

    const insert = await sb.from("pet_resumos_ia").insert({
      pet_id,
      resumo: parsed.resumo || "Sem resumo disponível.",
      score_saude: score,
      alertas: Array.isArray(parsed.alertas) ? parsed.alertas : [],
      recomendacoes: Array.isArray(parsed.recomendacoes) ? parsed.recomendacoes : [],
    }).select().maybeSingle();

    return new Response(JSON.stringify({ resumo: insert.data ?? parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ia-resumo-pet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
