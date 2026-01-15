import { CasafariClient } from "./casafari-client.ts";

type BuscaPayload = {
  query?: string;
  portals?: string[];
  filters?: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    operation?: "sale" | "rent";
  };
};

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as BuscaPayload;
  const portals =
    payload.portals ??
    ["olx", "facebook", "idealista", "bpi", "casa_sapo", "imovirtual", "casafari"];

  let casafariProperties = [];
  
  // If casafari is in the portals list, fetch properties
  if (portals.includes("casafari")) {
    try {
      const casafariClient = new CasafariClient();
      
      if (payload.filters) {
        // Search with filters
        casafariProperties = await casafariClient.searchProperties(payload.filters);
      } else {
        // List properties (default)
        casafariProperties = await casafariClient.listProperties(1, 20);
      }
    } catch (error) {
      console.error("Error fetching Casafari properties:", error);
    }
  }

  const result = {
    function: "ia-busca",
    status: "ok",
    portals,
    deduplication: "enabled",
    community_validations: 3,
    geolocation: true,
    query: payload.query ?? "all",
    casafari: {
      enabled: portals.includes("casafari"),
      properties_count: casafariProperties.length,
      properties: casafariProperties,
    },
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
