import Link from "next/link";

export default function IACoachingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8">
          ← Voltar
        </Link>
        <h1 className="text-4xl font-bold mb-4">2. IA Coaching</h1>
        <div className="inline-block rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40 mb-6">
          Gemini Planner
        </div>
        <p className="text-lg text-slate-300 mb-8">
          Metas SMART derivadas para €100k/ano, sessões 30-45min (diagnóstico, SWOT, estratégias, plano de ação), DISC + PNL, plano diário e 6+ KPIs em tempo real.
        </p>
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur">
          <p className="text-emerald-50">Módulo em desenvolvimento.</p>
        </div>
      </div>
    </div>
  );
}