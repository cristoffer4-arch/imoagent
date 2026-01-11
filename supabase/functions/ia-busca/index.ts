type BuscaPayload = {
  query?: string;
  portals?: string[];
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
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
