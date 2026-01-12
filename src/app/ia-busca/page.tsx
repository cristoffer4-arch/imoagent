import Link from "next/link";

export default function IABuscaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8"
        >
          ← Voltar para início
        </Link>
        
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-4">1. IA Busca</h1>
          <div className="inline-block rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40 mb-6">
            Gemini + Edge Function
          </div>
          <p className="text-lg text-slate-300 leading-relaxed">
            Scraping 7+ portais (OLX, Facebook, Idealista, BPI, Casa Sapo, Imovirtual, Casafari API), deduplicação por IA, geolocalização, mapas Supabase e validação comunitária de 3 usuários.
          </p>
        </header>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 text-xl">•</span>
                <span>Scraping automático de 7+ portais imobiliários portugueses</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 text-xl">•</span>
                <span>Deduplicação inteligente por IA usando Gemini</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 text-xl">•</span>
                <span>Geolocalização automática de imóveis</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 text-xl">•</span>
                <span>Integração com mapas Supabase para visualização</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 text-xl">•</span>
                <span>Validação comunitária de qualidade (mínimo 3 usuários)</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4">Portais Integrados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['OLX', 'Facebook Marketplace', 'Idealista', 'BPI Imobiliário', 'Casa Sapo', 'Imovirtual', 'Casafari API'].map((portal) => (
                <div
                  key={portal}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center text-sm font-medium"
                >
                  {portal}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold mb-3 text-emerald-100">Status</h2>
            <p className="text-emerald-50">
              Módulo em desenvolvimento. Disponível para usuários Premium.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}