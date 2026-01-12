"use client";

import Link from "next/link";

type Feature = {
  title: string;
  description: string;
  badge?: string;
  href?: string;
};

const aiModules: Feature[] = [
  {
    title: "1. IA Busca",
    description:
      "Scraping 7+ portais (OLX, Facebook, Idealista, BPI, Casa Sapo, Imovirtual, Casafari API), deduplicação por IA, geolocalização, mapas Supabase e validação comunitária de 3 usuários.",
    badge: "Gemini + Edge Function",
    href: "/ia-busca",
  },
  {
    title: "2. IA Coaching",
    description:
      "Metas SMART derivadas para €100k/ano, sessões 30-45min (diagnóstico, SWOT, estratégias, plano de ação), DISC + PNL, plano diário e 6+ KPIs em tempo real.",
    badge: "Gemini Planner",
    href: "/ia-coaching",
  },
  {
    title: "3. IA Gamificação",
    description:
      "Rankings em tempo real, feed social, competições, mini-games (puzzle, tabuleiro, arcade, quiz), dashboard de diretor com QR de onboarding, quadro de avisos, badges e relatório de desenvolvimento.",
  },
    href: "/ia-gamificacao",
    href: "/ia-anuncios-idealista",
  {
    title: "4. IA Anúncios Idealista",
    description:
      "Geração e otimização automática de anúncios para Idealista com variações criativas e checklist de conformidade.",
  },
  {
    title: "5. IA Assistente Legal",
    description:
      "Modelos de contratos, análise de riscos, checklist de due diligence e monitoramento de alterações legislativas.",
  },
    href: "/ia-assistente-legal",
  {
    title: "6. IA Leads/Comissões",
    description:
      "Pipeline de leads, scoring, distribuição inteligente, cálculo de comissões e reconciliação com Stripe.",
  },
    href: "/ia-leads-comissoes",
  {
    title: "7. IA Orquestradora",
    description:
      "Coordena as demais IAs, roteia prompts, monitora SLAs e envia alertas para incidentes ou quedas de qualidade.",
    badge: "Central",
  },
];

const opsFeatures: Feature[] = [
  {
    title: "Agenda Integrada",
    description:
      "IA de tracking do consultor, avisos, Pomodoro, Time Blocking, Eat the Frog, GTD e ciclo 52-17.",
  },
  {
    title: "Scanner e OCR",
    description:
      "Upload, OCR em Edge Function e armazenamento em bucket Supabase com versão e histórico de acesso.",
  },
  {
    title: "Controle de Comissões",
    description:
      "Registo de leads, contratos, milestones e cálculo de partilha. KPIs de margem, CAC/LTV e tempo médio.",
  },
  {
    title: "Design iOS-style",
    description:
      "Dark/Light com animações suaves, cards de vidro fosco e layout responsivo otimizado para mobile.",
  },
  {
    title: "Autenticação Supabase",
    description: "Email, Google e redes sociais com RLS aplicada em 15+ tabelas.",
  },
  {
    title: "Stripe Free/Premium",
    description:
      "Planos Free e Premium €3.99/mês, voucher “LancamentoPortugal” 3 meses grátis e portal de faturação.",
  },
];

const supabaseTables = [
  "profiles",
  "consultants",
  "properties",
  "leads",
  "commissions",
  "subscriptions",
  "payments",
  "appointments",
  "tasks",
  "documents",
  "storage_files",
  "coaching_sessions",
  "kpi_snapshots",
  "competitions",
  "notifications",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-emerald-500/10 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
              Next.js 15 • Supabase • Stripe • 7 IAs Gemini
            </p>
            <p className="text-sm text-slate-300">
              App Router • TypeScript • Tailwind CSS • RLS + 7 Edge Functions
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Imoagent: plataforma imobiliária completa, centrada em IA e dados.
            </h1>
            <p className="max-w-3xl text-lg text-slate-200">
              Operações fim-a-fim: captação em 7+ portais, coaching de alta
              performance, gamificação, anúncios Idealista, assistente legal,
              gestão de leads/comissões e uma IA orquestradora para manter tudo
              em ordem. Supabase garante dados seguros (PostgreSQL + RLS) e
              Stripe habilita monetização com voucher de lançamento.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#checkout"
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Ativar Premium €3.99/mês
              </Link>
              <Link
                href="#ai"
                className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/5"
              >
                Ver as 7 IAs
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Edge Functions", value: "7" },
              { label: "Tabelas com RLS", value: "15+" },
              { label: "KPIs em tempo real", value: "6+" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="text-sm text-slate-300">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </header>

        <section
          id="ai"
          className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:grid-cols-2"
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
              7 IAs Gemini
            </p>
            <h2 className="text-3xl font-semibold">Esteira de IA orquestrada</h2>
            <p className="text-slate-200">
              Cada IA roda em Edge Functions Supabase, coordenadas pela IA
              Central. Os prompts consideram contexto de lead, imóvel, metas e
              histórico de interações para respostas consistentes.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {aiModules.map((feature) => (
              <Link
href={feature.href || "#"}
                 transition hover:bg-black/50 hover:border-emerald-500/30 cursor-pointer                key={feature.title}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  {feature.badge ? (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-emerald-200">
                      {feature.badge}
                    </span>
                  ) : null}
                </Link>
                <p className="text-sm text-slate-200">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold">Operações end-to-end</h2>
            <p className="text-slate-200">
              Agenda integrada, scanner OCR, cloud storage e controle de
              comissões ficam conectados ao pipeline de leads e ao checkout do
              Stripe.
            </p>
          </div>
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            {opsFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <p className="text-xs uppercase text-emerald-200/80">
                  {feature.badge ?? "Feature"}
                </p>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-slate-200">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Stripe + Voucher</h2>
            <p className="text-slate-200">
              Plano Free com onboarding imediato e Premium a €3.99/mês. Voucher
              <span className="font-semibold text-emerald-300">
                {" "}
                “LançamentoPortugal”
              </span>{" "}
              (código: LancamentoPortugal) concede 3 meses grátis. Portal de
              faturação disponível.
            </p>
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">
                IA Central valida elegibilidade e envia para Stripe Checkout.
              </p>
              <p className="text-sm text-emerald-50">
                API em <code className="font-mono">/api/checkout</code> recebe
                voucher e devolve session URL.
              </p>
            </div>
          </div>
          <div
            id="checkout"
            className="rounded-2xl border border-white/10 bg-black/40 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Premium</p>
                <p className="text-3xl font-semibold">€3.99/mês</p>
              </div>
              <p className="rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-200">
                voucher: LançamentoPortugal (LancamentoPortugal)
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>• Coaching IA ilimitado e KPIs em tempo real</li>
              <li>• Scraping portais + deduplicação inteligente</li>
              <li>• Gamificação, ranking e mini-games</li>
              <li>• Orquestração central com alertas</li>
            </ul>
            <Link
              href="/api/checkout"
              className="mt-4 block rounded-full bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
            >
              Simular checkout
            </Link>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Supabase</h2>
            <p className="text-slate-200">
              PostgreSQL com Row Level Security ligada em todas as 15 tabelas e
              7 Edge Functions. Autenticação Supabase (email, Google, social).
            </p>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold text-emerald-100">
                Mapas e geolocalização
              </p>
              <p className="text-sm text-slate-200">
                IA de busca grava coordenadas em
                <code className="mx-1 rounded bg-white/10 px-1">properties</code>
                e exibe em mapas Supabase.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-emerald-200">
              Tabelas com RLS
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
              {supabaseTables.map((table) => (
                <span
                  key={table}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-center"
                >
                  {table}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-teal-400/20 p-6 backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">
              Roteiro diário
            </p>
            <h2 className="text-2xl font-semibold">Agenda + KPIs em tempo real</h2>
            <p className="text-slate-100">
              Técnicas Pomodoro, Time Blocking, Eat the Frog e 52-17 integradas
              à IA de coaching. Alertas automáticos de atrasos e próximas
              visitas.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              "Leads qualificadas / dia",
              "Taxa de conversão visitas",
              "Comissões recebidas mês",
            ].map((kpi) => (
              <div
                key={kpi}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white"
              >
                {kpi}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">
            Playwright + Jest prontos
          </h2>
          <p>
            Testes unitários (Jest) validam renderização do dashboard e
            Playwright cobre a página inicial. Edge Functions e APIs são
            modeladas para CI rápido.
          </p>
        </section>
      </div>
    </div>
  );
}
