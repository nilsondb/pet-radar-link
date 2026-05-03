const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente veterinário virtual.

Sua função é:
- explicar exames de pets de forma simples
- traduzir termos técnicos
- sugerir possíveis causas (sem afirmar diagnóstico)
- orientar quando procurar um veterinário

REGRAS IMPORTANTES:
- nunca dar diagnóstico definitivo
- nunca receitar medicamentos
- nunca substituir um veterinário
- usar linguagem simples e clara

Se receber uma imagem ou PDF, leia o conteúdo do exame e analise.

Formato da resposta (markdown com títulos):
1. **Explicação simples**
2. **Possíveis causas**
3. **Quando se preocupar**
4. **Recomendação final**

Sempre incluir no final:
"⚠️ Este assistente não substitui um veterinário. Procure um profissional para avaliação completa."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pergunta, fileBase64, fileMime } = await req.json();

    const hasText = typeof pergunta === "string" && pergunta.trim().length > 0;
    const hasFile = typeof fileBase64 === "string" && fileBase64.length > 0 && typeof fileMime === "string";

    if (!hasText && !hasFile) {
      return new Response(JSON.stringify({ error: "Envie um texto ou arquivo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (hasText && pergunta.length > 8000) {
      return new Response(JSON.stringify({ error: "Texto muito longo (máx 8000 caracteres)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (hasFile) {
      const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!allowed.includes(fileMime)) {
        return new Response(JSON.stringify({ error: "Formato não suportado. Use PDF, PNG, JPG ou WEBP." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // ~10MB base64 limit
      if (fileBase64.length > 14_000_000) {
        return new Response(JSON.stringify({ error: "Arquivo muito grande (máx ~10MB)" }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const userContent: any[] = [];
    userContent.push({
      type: "text",
      text: hasText
        ? `Pergunta do usuário:\n${pergunta}`
        : "Analise o exame anexado seguindo o formato solicitado.",
    });
    if (hasFile) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${fileMime};base64,${fileBase64}` },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const resposta = data.choices?.[0]?.message?.content ?? "Sem resposta.";

    return new Response(JSON.stringify({ resposta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ia-exame error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
