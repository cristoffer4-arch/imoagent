type CoachingPayload = {
  profile?: string;
  goal?: string;
};

export async function handler(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as CoachingPayload;

  const plan = {
    function: "ia-coaching",
    status: "ok",
    session_length_minutes: 45,
    goal: payload.goal ?? "€100k/ano",
    profile: payload.profile ?? "consultor",
    kpis: ["leads/dia", "taxa visita", "taxa proposta", "tempo ciclo", "MQL -> SQL", "Receita"],
  };

  return new Response(JSON.stringify(plan), {
    headers: { "Content-Type": "application/json" },
  });
}
