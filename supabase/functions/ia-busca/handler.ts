import { scoreAndRankProperties, type SearchCriteria, type PropertyData } from "./scoring.ts";

type BuscaPayload = {
  query?: string;
  portals?: string[];
  criteria?: SearchCriteria;
  mockProperties?: PropertyData[];
};

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as BuscaPayload;
  const portals =
    payload.portals ??
    ["olx", "facebook", "idealista", "bpi", "casa_sapo", "imovirtual", "casafari"];

  // Mock properties for demonstration
  const mockProperties: PropertyData[] = payload.mockProperties ?? [
    {
      id: "prop-1",
      distrito: "Lisboa",
      concelho: "Lisboa",
      freguesia: "Alameda",
      typology: "T2",
      price_main: 250000,
      area_m2: 75,
      bedrooms: 2,
      portal_count: 3,
      first_seen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      availability_probability: 0.8,
    },
    {
      id: "prop-2",
      distrito: "Lisboa",
      concelho: "Lisboa",
      freguesia: "Arroios",
      typology: "T3",
      price_main: 300000,
      area_m2: 90,
      bedrooms: 3,
      portal_count: 2,
      first_seen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      availability_probability: 0.6,
    },
    {
      id: "prop-3",
      distrito: "Lisboa",
      concelho: "Cascais",
      freguesia: "Cascais",
      typology: "T2",
      price_main: 280000,
      area_m2: 80,
      bedrooms: 2,
      portal_count: 4,
      first_seen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      availability_probability: 0.9,
    },
  ];

  // Default search criteria if not provided
  const criteria: SearchCriteria = payload.criteria ?? {
    location: {
      distrito: "Lisboa",
      concelho: "Lisboa",
    },
    price: {
      min: 200000,
      max: 300000,
    },
    type: "T2",
  };

  // Score and rank properties
  const rankedProperties = scoreAndRankProperties(mockProperties, criteria);

  const result = {
    function: "ia-busca",
    status: "ok",
    portals,
    deduplication: "enabled",
    community_validations: 3,
    geolocation: true,
    query: payload.query ?? "all",
    scoring: {
      enabled: true,
      formula: "ScoreFinal = (0.4 × Compatibilidade) + (0.3 × Comportamento) + (0.3 × Temporal)",
      total_properties: rankedProperties.length,
      average_score: rankedProperties.reduce((sum, p) => sum + p.finalScore, 0) / rankedProperties.length,
      top_score: rankedProperties[0]?.finalScore ?? 0,
    },
    properties: rankedProperties,
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
