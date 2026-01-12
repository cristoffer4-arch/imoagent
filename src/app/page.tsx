"use client";

import Link from "next/link";
import {
  Search,
  Target,
  Trophy,
  Megaphone,
  Scale,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
};

const features: Feature[] = [
  {
    title: "IA Busca",
    description:
      "Scraping 7+ portais (OLX, Facebook, Idealista, BPI, Casa Sapo, Imovirtual, Casafari API), deduplicação por IA, geolocalização e validação comunitária.",
    icon: <Search className="w-6 h-6" />,
    color: "#E91E63",
    href: "/ia-busca",
  },
  {
    title: "IA Coaching",
    description:
      "Metas SMART para €100k/ano, sessões 30-45min (diagnóstico, SWOT, estratégias), DISC + PNL, plano diário e 6+ KPIs em tempo real.",
    icon: <Target className="w-6 h-6" />,
    color: "#FF5722",
    href: "/ia-coaching",
  },
  {
    title: "IA Gamificação",
    description:
      "Rankings em tempo real, feed social, competições, mini-games (puzzle, tabuleiro, arcade, quiz), badges e relatório de desenvolvimento.",
    icon: <Trophy className="w-6 h-6" />,
    color: "#4CAF50",
    href: "/ia-gamificacao",
  },
  {
    title: "IA Anúncios Idealista",
    description:
      "Geração e otimização automática de anúncios para Idealista com variações criativas e checklist de conformidade.",
    icon: <Megaphone className="w-6 h-6" />,
    color: "#9C27B0",
    href: "/ia-anuncios-idealista",
  },
  {
    title: "IA Assistente Legal",
    description:
      "Modelos de contratos, análise de riscos, checklist de due diligence e monitoramento de alterações legislativas.",
    icon: <Scale className="w-6 h-6" />,
    color: "#2196F3",
    href: "/ia-assistente-legal",
  },
  {
    title: "IA Leads/Comissões",
    description:
      "Pipeline de leads, scoring, distribuição inteligente, cálculo de comissões e reconciliação com Stripe.",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "#FF5722",
    href: "/ia-leads-comissoes",
  },
  {
    title: "IA Orquestradora",
    description:
      "Coordena as demais IAs, roteia prompts, monitora SLAs e envia alertas para incidentes ou quedas de qualidade.",
    icon: <Sparkles className="w-6 h-6" />,
    color: "#E91E63",
    href: "/ia-orquestradora",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Hero Card com Gradiente Rosa/Roxo */}
        <div className="mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#9C27B0] p-10 shadow-2xl lg:p-16">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
              Imoagent
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-white/95 lg:text-xl">
              Plataforma imobiliária completa, centrada em IA e dados. Operações
              fim-a-fim: captação em 7+ portais, coaching de alta performance,
              gamificação, anúncios Idealista, assistente legal, gestão de
              leads/comissões e uma IA orquestradora.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#features"
                className="rounded-full bg-white px-8 py-3 font-semibold text-[#E91E63] shadow-lg transition hover:scale-105 hover:shadow-xl"
              >
                Explorar funcionalidades
              </Link>
              <Link
                href="#checkout"
                className="rounded-full border-2 border-white bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mb-12">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 lg:text-4xl">
              7 IAs para impulsionar seu negócio
            </h2>
            <p className="text-lg text-gray-600">
              Esteira de IA orquestrada rodando em Edge Functions Supabase
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: feature.color }}
                  >
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-12 overflow-hidden rounded-2xl bg-white p-8 shadow-md">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="mb-2 text-4xl font-bold text-[#E91E63]">7</p>
              <p className="text-sm font-medium text-gray-600">
                Edge Functions
              </p>
            </div>
            <div className="text-center">
              <p className="mb-2 text-4xl font-bold text-[#9C27B0]">15+</p>
              <p className="text-sm font-medium text-gray-600">
                Tabelas com RLS
              </p>
            </div>
            <div className="text-center">
              <p className="mb-2 text-4xl font-bold text-[#4CAF50]">6+</p>
              <p className="text-sm font-medium text-gray-600">
                KPIs em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div
          id="checkout"
          className="overflow-hidden rounded-2xl bg-white p-8 shadow-md lg:p-12"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Comece agora
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Plano Premium com voucher de lançamento para Portugal
            </p>
            <div className="mb-6 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#9C27B0] p-8 text-white">
              <p className="mb-2 text-lg font-semibold">Premium</p>
              <p className="mb-4 text-5xl font-bold">€3.99/mês</p>
              <p className="mb-6 text-sm text-white/90">
                Use o voucher "LançamentoPortugal" para 3 meses grátis
              </p>
              <ul className="mb-6 space-y-2 text-left text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Coaching IA ilimitado e KPIs em tempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Scraping portais + deduplicação inteligente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Gamificação, ranking e mini-games</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Orquestração central com alertas</span>
                </li>
              </ul>
              <Link
                href="/api/checkout"
                className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-[#E91E63] transition hover:scale-105"
              >
                Ativar Premium
              </Link>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-gray-500">
            Next.js 15 • Supabase • Stripe • TypeScript • Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
