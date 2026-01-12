import Link from "next/link";

export default function IAOrquestradoraPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8">← Voltar</Link>
        <h1 className="text-4xl font-bold mb-4">7. IA Orquestradora</h1>
        <div className="inline-block rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40 mb-6">Central</div>
        <p className="text-lg text-slate-300 mb-8">Coordena as demais IAs, roteia prompts, monitora SLAs e envia alertas para incidentes ou quedas de qualidade.</p>
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur">
          <p className="text-emerald-50">Módulo em desenvolvimento.</p>
        </div>
      </div>
    </div>
  );
}