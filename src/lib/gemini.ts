import { getSupabaseBrowser } from "@/lib/supabase/client";

type PortalKey =
  | "idealista"
  | "olx"
  | "imovirtual"
  | "casaSapo"
  | "bpi"
  | "facebook";

type PortalOutput = {
  title: string;
  description: string;
  highlights: string[];
  checklist: string[];
  cta: string;
  hashtags: string[];
  mock?: boolean;
};

type GenerateAdsResponse = {
  ok: boolean;
  text?: string;
  message?: string;
  status?: number;
  mock?: boolean;
};

const isDev = process.env.NODE_ENV !== "production";

const mockPortalsJson = (prompt: string) => {
  const portals: PortalKey[] = [
    "idealista",
    "olx",
    "imovirtual",
    "casaSapo",
    "bpi",
    "facebook",
  ];
  const baseDescription = prompt.slice(0, 400) || "Anúncio IA demo";
  const payload = portals.reduce((acc, portal) => {
    acc[portal] = {
      title: `Mock ${portal} — IA Imoagent`,
      description: `${baseDescription}. (Mock de desenvolvimento)`,
      highlights: [
        "Destaque 1",
        "Destaque 2",
        "Destaque 3",
        "Destaque 4",
        "Destaque 5",
      ],
      checklist: [
        "Classe energética visível",
        "Preço coerente",
        "Localização sem PII",
        "Fotos 4:3 legendadas",
        "CTA visível",
      ],
      cta: "Agende visita esta semana",
      hashtags: ["#imoagent", "#mock", "#anuncio", "#portugal"],
      mock: true,
    };
    return acc;
  }, {} as Record<PortalKey, PortalOutput>);

  return JSON.stringify(payload);
};

// Generic mock that keeps interface compatibility for legacy calls
async function callGemini(prompt: string): Promise<GenerateAdsResponse> {
  return {
    ok: true,
    mock: true,
    text: `Mock Gemini response (edge disabled): ${prompt}`,
    message: "Gemini direto desativado; usando mock local.",
  };
}

async function callGenerateAds(prompt: string): Promise<GenerateAdsResponse> {
  // Dev fallback when running without Supabase or auth context
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isDev && (!supabaseUrl || !supabaseKey)) {
    return { ok: true, mock: true, text: mockPortalsJson(prompt) };
  }

  try {
    const supabase = getSupabaseBrowser();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      if (isDev) {
        return { ok: true, mock: true, text: mockPortalsJson(prompt) };
      }
      return { ok: false, status: 401, message: "Utilizador não autenticado." };
    }

    const body = {
      propertyData: {
        title: prompt.slice(0, 80) || "Anúncio IA Imoagent",
        description: prompt,
      },
      strategy: {
        tone: "Confiante",
        persona: "Lead digital",
        cta: "Agende visita esta semana",
        compliance: true,
        variations: 3,
      },
      portals: ["idealista", "olx", "imovirtual", "casaSapo", "bpi", "facebook"],
    };

    const { data, error } = await supabase.functions.invoke("generate-ads", {
      body,
    });

    if (error) {
      if (isDev) {
        return { ok: true, mock: true, text: mockPortalsJson(prompt) };
      }
      return { ok: false, status: 500, message: error.message };
    }

    const portalsJson = JSON.stringify((data as { portals?: unknown }).portals ?? {});
    return {
      ok: true,
      text: portalsJson,
      mock: Boolean((data as { mock?: boolean }).mock),
    };
  } catch (error) {
    if (isDev) {
      return { ok: true, mock: true, text: mockPortalsJson(prompt) };
    }
    return { ok: false, status: 500, message: (error as Error).message };
  }
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

export const iaAnunciosIdealista = (imovel: string) => callGenerateAds(imovel);

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
