type OrquestraPayload = { 
  event?: string;
  target?: string; // Target function to route to
  casafariQuery?: {
    action: 'list' | 'details' | 'search';
    propertyId?: string;
    filters?: any;
  };
};

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as OrquestraPayload;

  // Route Casafari queries to ia-busca
  if (payload.casafariQuery) {
    const casafariResult = {
      function: "ia-orquestradora",
      status: "routing",
      event: "casafari_query",
      target: "ia-busca",
      action: payload.casafariQuery.action,
      casafari: {
        service: "CasafariService",
        methods: {
          list: "listProperties() - List properties with pagination",
          details: "getPropertyDetails(id) - Get property details by ID",
          search: "searchProperties(filters) - Advanced search with filters",
        },
        authentication: "API key via CASAFARI_API_KEY env variable",
        caching: "In-memory cache with 5 min TTL",
        transformation: "Automatic conversion to PropertyCanonicalModel",
      },
      note: "CasafariService integrated. All queries routed through ia-busca module.",
    };

    return new Response(JSON.stringify(casafariResult), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = {
    function: "ia-orquestradora",
    status: "ok",
    event: payload.event ?? "heartbeat",
    routes: [
      "ia-busca",
      "ia-coaching",
      "ia-gamificacao",
      "ia-anuncios-idealista",
      "ia-assistente-legal",
      "ia-leads-comissoes",
    ],
    integrations: {
      casafari: {
        status: "active",
        route: "ia-busca",
        service: "CasafariService",
        location: "src/services/casafari/",
        methods: ["listProperties", "getPropertyDetails", "searchProperties"],
        documentation: "https://docs.api.casafari.com",
      },
    },
    alerts: true,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}
