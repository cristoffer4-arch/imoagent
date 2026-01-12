import Link from "next/link";

export default function IALeadsComissoesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8">← Voltar</Link>
        <h1 className="text-4xl font-bold mb-4">6. IA Leads/Comissões</h1>
        <p className="text-lg text-slate-300 mb-8">Pipeline de leads, scoring, distribuição inteligente, cálculo de comissões e reconciliação com Stripe.</p>
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur">
          <p className="text-emerald-50">Módulo em desenvolvimento.</p>
        </div>
      </div>
    </div>
  );
}