type OrquestraPayload = { event?: string };

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as OrquestraPayload;

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
    alerts: true,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}
