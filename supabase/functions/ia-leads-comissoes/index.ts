type LeadPayload = { stage?: string };

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as LeadPayload;

  const response = {
    function: "ia-leads-comissoes",
    status: "ok",
    stage: payload.stage ?? "prospecting",
    commission_formula: "percentual + bonus",
    reconciliation: "stripe",
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}
