const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "models/gemini-1.5-flash-latest";

async function callGemini(prompt: string) {
  if (!GEMINI_API_KEY) {
    return {
      ok: true,
      mock: true,
      prompt,
      message:
        "GEMINI_API_KEY ausente - resposta simulada para desenvolvimento offline.",
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }], role: "user" }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    },
  );

  if (!response.ok) {
    return { ok: false, status: response.status, statusText: response.statusText };
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  return {
    ok: true,
    text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
  };
}

export const iaBusca = (query: string) =>
  callGemini(
    `Extraia imóveis de 7+ portais (OLX, Facebook, Idealista, BPI, Casa Sapo, Imovirtual, Casafari). Deduplica, geolocaliza e devolve JSON com latitude/longitude. Query: ${query}`,
  );

export const iaCoaching = (perfil: string) =>
  callGemini(
    `Crie plano coaching 30-45min com metas SMART para €100k/ano, SWOT, DISC/PNL, plano diário e 6 KPIs realtime. Perfil: ${perfil}`,
  );

export const iaGamificacao = (contexto: string) =>
  callGemini(
    `Sugira ranking, feed social, competições, mini-games (puzzle, tabuleiro, arcade, quiz) e badges. Contexto: ${contexto}`,
  );

export const iaAnunciosIdealista = (imovel: string) =>
  callGemini(
    `Gere anúncio Idealista otimizado com variantes criativas, checklist de conformidade e CTA. Imóvel: ${imovel}`,
  );

export const iaAssistenteLegal = (contrato: string) =>
  callGemini(
    `Revise contrato, gere checklist de riscos e due diligence imobiliária, cite legislação relevante. Contrato: ${contrato}`,
  );

export const iaLeadsComissoes = (pipeline: string) =>
  callGemini(
    `Calcule comissões, priorize leads, gere plano de follow-up e reconcilie pagamentos Stripe. Pipeline: ${pipeline}`,
  );

export const iaCentral = (evento: string) =>
  callGemini(
    `Atue como IA Orquestradora coordenando 6 IAs anteriores. Monitore SLAs e envie alertas. Evento: ${evento}`,
  );
