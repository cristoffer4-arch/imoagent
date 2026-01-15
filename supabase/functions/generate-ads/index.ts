// Supabase Edge Function: generate-ads
// Endpoint: POST /functions/v1/generate-ads
// Features: Auth (JWT), rate limit (10 req/min per user), Gemini integration, fallbacks, CORS

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
export type PortalKey =
  | "idealista"
  | "olx"
  | "imovirtual"
  | "casaSapo"
  | "bpi"
  | "facebook";

export type PropertyData = {
  title: string;
  description: string;
  price?: number;
  area?: number;
  location?: string;
  energy?: string;
  highlights?: string[];
};

export type Strategy = {
  tone: string;
  persona: string;
  cta: string;
  compliance?: boolean;
  variations?: number;
};

export type GenerateAdsRequest = {
  propertyData?: PropertyData;
  strategy?: Strategy;
  portals?: PortalKey[];
};

export type PortalOutput = {
  title: string;
  description: string;
  highlights: string[];
  checklist: string[];
  cta: string;
  hashtags: string[];
  mock?: boolean;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "models/gemini-1.5-pro"; // requirement
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

const kv = await Deno.openKv();

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

const errorResponse = (message: string, status = 400, details?: unknown) =>
  jsonResponse({ ok: false, message, details }, status);

const validateRequest = (payload: GenerateAdsRequest) => {
  const errs: string[] = [];
  if (!payload.propertyData) errs.push("propertyData é obrigatório");
  if (!payload.propertyData?.title) errs.push("propertyData.title é obrigatório");
  if (!payload.propertyData?.description) errs.push("propertyData.description é obrigatório");
  if (!payload.strategy) errs.push("strategy é obrigatório");
  if (!payload.strategy?.tone) errs.push("strategy.tone é obrigatório");
  if (!payload.strategy?.persona) errs.push("strategy.persona é obrigatório");
  if (!payload.strategy?.cta) errs.push("strategy.cta é obrigatório");
  if (!payload.portals?.length) errs.push("portals precisa de ao menos 1 item");
  return errs;
};

const buildPrompt = (
  property: PropertyData,
  strategy: Strategy,
  portals: PortalKey[],
) => {
  const highlights = property.highlights?.join("; ") ?? "";
  return `Gere anuncios estruturados para os portais: ${portals.join(", ")}. Responda apenas em JSON com as chaves ${portals.join(", ")}.
Cada portal deve conter: title, description (<=1200 chars), highlights (5 bullets), checklist (5 itens de conformidade para o portal e legislação PT), cta e hashtags (<=6).
Dados do imóvel: titulo=${property.title}; descricao=${property.description}; preco=${property.price ?? "n/d"}; area=${property.area ?? "n/d"}; localizacao=${property.location ?? "n/d"}; energia=${property.energy ?? "n/d"}; destaques=${highlights}.
Estratégia: tom=${strategy.tone}; persona=${strategy.persona}; cta=${strategy.cta}; compliance=${strategy.compliance ? "sim" : "nao"}; variacoes=${strategy.variations ?? 3}.
Modelo deve ser conciso, evitar PII e incluir CTA explícito.`;
};

const fallbackPortal = (portal: PortalKey, property: PropertyData, strategy: Strategy): PortalOutput => {
  const hl = (property.highlights ?? ["Varanda", "Luz natural", "Proximidade a transportes"]).slice(0, 5);
  return {
    title: `${property.title} — ${portal}`,
    description: `${property.description} Preço: €${property.price ?? "sob consulta"}. Área: ${property.area ?? "n/d"} m². Localização: ${property.location ?? "n/d"}. Classe energética: ${property.energy ?? "n/d"}.`,
    highlights: hl,
    checklist: [
      "Classe energética visível",
      "Preço e tipologia consistentes",
      "Localização sem dados sensíveis",
      "Fotos 4:3 com legenda",
      "CTA visível e formulário ativo",
    ],
    cta: strategy.cta,
    hashtags: ["#imobiliario", "#portugal", "#idealista", "#venda"].slice(0, 6),
    mock: true,
  };
};

const parseGeminiJson = (
  raw: string,
  portals: PortalKey[],
  property: PropertyData,
  strategy: Strategy,
): Record<PortalKey, PortalOutput> => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: Partial<Record<PortalKey, Partial<PortalOutput>>> | null = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = null;
  }

  const outputs: Record<PortalKey, PortalOutput> = {} as Record<PortalKey, PortalOutput>;
  portals.forEach((p) => {
    const ai = parsed?.[p];
    const fallback = fallbackPortal(p, property, strategy);
    outputs[p] = {
      ...fallback,
      ...(ai ?? {}),
      highlights: ai?.highlights?.length ? ai.highlights : fallback.highlights,
      checklist: ai?.checklist?.length ? ai.checklist : fallback.checklist,
      mock: fallback.mock || ai?.mock,
    };
  });
  return outputs;
};

const verifyAuth = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: "Authorization header ausente" } as const;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) return { error: "Variáveis SUPABASE_URL/ANON_KEY ausentes" } as const;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { error: "Token inválido", details: error?.message } as const;

  return { userId: data.user.id } as const;
};

const rateLimitKey = (userId: string) => {
  const bucket = new Date();
  const minute = `${bucket.getUTCFullYear()}-${bucket.getUTCMonth()}-${bucket.getUTCDate()}-${bucket.getUTCHours()}-${bucket.getUTCMinutes()}`;
  return ["generate-ads", userId, minute];
};

const checkRateLimit = async (userId: string) => {
  const key = rateLimitKey(userId);
  const entry = await kv.get<number>(key);
  const current = entry.value ?? 0;
  if (current >= RATE_LIMIT.limit) return { allowed: false, current } as const;

  const ok = await kv
    .atomic()
    .check(entry)
    .set(key, current + 1, { expireIn: RATE_LIMIT.windowMs })
    .commit();

  if (!ok.ok) return { allowed: false, current } as const;
  return { allowed: true, current: current + 1 } as const;
};

const callGemini = async (prompt: string) => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL;
  if (!apiKey) return { ok: false, message: "GEMINI_API_KEY ausente" } as const;

  const resp = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }], role: "user" }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    }),
  });

  if (!resp.ok) {
    return { ok: false, status: resp.status, statusText: resp.statusText } as const;
  }

  const data = (await resp.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { ok: true, text } as const;
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return errorResponse("Método não suportado", 405);

  const requestId = crypto.randomUUID();
  const start = performance.now();

  try {
    const auth = await verifyAuth(req);
    if ("error" in auth) return errorResponse(auth.error, 401, auth.details);

    const rate = await checkRateLimit(auth.userId);
    if (!rate.allowed) return errorResponse("Rate limit excedido (10 req/min)", 429, { current: rate.current });

    const payload = (await req.json().catch(() => ({}))) as GenerateAdsRequest;
    const validation = validateRequest(payload);
    if (validation.length) return errorResponse("Payload inválido", 400, validation);

    const portals = payload.portals as PortalKey[];
    const prompt = buildPrompt(payload.propertyData!, payload.strategy!, portals);

    const gemini = await callGemini(prompt);

    let outputs: Record<PortalKey, PortalOutput>;
    let mock = false;

    if (!gemini.ok) {
      outputs = parseGeminiJson("{}", portals, payload.propertyData!, payload.strategy!);
      mock = true;
    } else {
      outputs = parseGeminiJson(gemini.text ?? "{}", portals, payload.propertyData!, payload.strategy!);
      mock = Boolean(outputs?.[portals[0]]?.mock);
    }

    const durationMs = Math.round(performance.now() - start);

    console.log(
      JSON.stringify({
        fn: "generate-ads",
        requestId,
        userId: auth.userId,
        durationMs,
        portals,
        rateUsed: rate.current,
        model: Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL,
        geminiOk: gemini.ok,
      }),
    );

    return jsonResponse({
      ok: true,
      requestId,
      portals: outputs,
      mock,
      usage: {
        userId: auth.userId,
        rateLimit: { limit: RATE_LIMIT.limit, used: rate.current, window: "1m" },
        model: Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL,
        durationMs,
      },
    });
  } catch (error) {
    console.error("generate-ads error", error);
    return errorResponse("Erro interno ao gerar anúncios", 500);
  }
});
