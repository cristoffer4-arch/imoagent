type LegalPayload = { documentName?: string };

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as LegalPayload;

  const response = {
    function: "ia-assistente-legal",
    status: "ok",
    document: payload.documentName ?? "contrato-demo.pdf",
    outputs: ["checklist_riscos", "due_diligence", "resumo_legislacao"],
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}
