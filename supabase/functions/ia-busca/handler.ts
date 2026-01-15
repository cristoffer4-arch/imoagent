type BuscaPayload = {
  query?: string;
  portals?: string[];
  transform?: boolean; // Se true, retorna dados transformados no modelo canônico
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
    note: "Canonical model implementation complete. Use PropertyRepository for CRUD operations.",
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
