type AnuncioPayload = { propertyId?: string; copyHint?: string };

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as AnuncioPayload;

  const response = {
    function: "ia-anuncios-idealista",
    status: "ok",
    propertyId: payload.propertyId ?? "demo",
    variants: 3,
    compliance_checklist: true,
    copyHint: payload.copyHint,
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}
