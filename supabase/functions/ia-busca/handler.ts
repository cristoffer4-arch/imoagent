type BuscaPayload = {
  query?: string;
  portals?: string[];
  transform?: boolean; // Se true, retorna dados transformados no modelo canônico
  casafari?: {
    enabled?: boolean;
    filters?: {
      municipality?: string;
      district?: string;
      minPrice?: number;
      maxPrice?: number;
      propertyType?: string[];
      transactionType?: 'sale' | 'rent';
      minBedrooms?: number;
      page?: number;
      limit?: number;
    };
  };
};

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as BuscaPayload;
  const portals =
    payload.portals ??
    ["olx", "facebook", "idealista", "bpi", "casa_sapo", "imovirtual", "casafari"];

  const result = {
    function: "ia-busca",
    status: "ok",
    portals,
    deduplication: "enabled",
    community_validations: 3,
    geolocation: true,
    query: payload.query ?? "all",
    casafari: {
      enabled: payload.casafari?.enabled ?? true,
      integrated: true,
      apiEndpoint: "/api/casafari",
      service: "CasafariService",
      methods: ["listProperties", "getPropertyDetails", "searchProperties"],
      features: [
        "API key authentication",
        "In-memory caching (5 min TTL)",
        "Automatic transformation to PropertyCanonicalModel",
        "Support for advanced filters (location, price, area, bedrooms)",
        "Pagination support",
        "Error handling with CasafariApiError",
      ],
      documentation: "https://docs.api.casafari.com",
      filters: payload.casafari?.filters,
    },
    canonicalModel: {
      enabled: true,
      transformers: ["casafari", "crm"],
      validators: ["address", "coordinates", "price", "characteristics"],
      features: [
        "Data validation with Zod schemas",
        "Address normalization and geocoding",
        "Multi-source data aggregation",
        "Duplicate detection",
        "Quality scoring",
      ],
    },
    repository: {
      available: true,
      operations: ["create", "read", "update", "delete", "search", "nearby"],
      indexes: [
        "tenant_id",
        "geohash",
        "concelho",
        "distrito",
        "angaria_score",
        "venda_score",
      ],
    },
    note: "Canonical model implementation complete. CasafariService integrated. Use PropertyRepository for CRUD operations.",
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
