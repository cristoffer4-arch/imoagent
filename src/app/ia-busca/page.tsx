"use client";

import Link from "next/link";
import { Database, Server, Cpu, Layers, Zap, GitBranch, CheckCircle2, AlertCircle } from "lucide-react";

export default function IABuscaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8"
        >
          ← Voltar para início
        </Link>
        
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-500/40">
              <Database className="w-3 h-3" />
              Supabase
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200 ring-1 ring-purple-500/40">
              <Server className="w-3 h-3" />
              Netlify Functions
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
              <Cpu className="w-3 h-3" />
              IA Orquestradora
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Módulo: Busca de Imóveis IA
          </h1>
          
          <p className="text-xl text-slate-300 leading-relaxed max-w-4xl">
            Sistema completo de agregação multi-portal com deduplicação inteligente, 
            scores de Angariação e Venda, e pipeline automatizado de oportunidades.
          </p>
        </header>

        {/* Section 1: Objetivo */}
        <section className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-semibold mb-4 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              1. Objetivo do Módulo
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Centralizar e normalizar dados de imóveis de múltiplas fontes (portais, Casafari, CRMs), 
              criando uma <strong>base de dados canónica</strong> com <strong>Imóveis Únicos</strong> (PropertyEntity). 
              Calcular <strong>AngariaScore</strong> e <strong>VendaScore</strong> para priorizar oportunidades 
              de angariação e venda, respectivamente.
            </p>
          </div>
        </section>

        {/* Section 2: Fontes de Dados */}
        <section className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-400" />
              2. Fontes de Dados
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Portais */}
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">Portais Imobiliários</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Idealista
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Imovirtual
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    OLX
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Facebook Marketplace
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Casa Sapo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    BPI Imobiliário
                  </li>
                </ul>
              </div>

              {/* Casafari */}
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Casafari API</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Plataforma premium com dados enriquecidos e histórico de mercado.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Geolocalização precisa
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Histórico de preços
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Market insights
                  </li>
                </ul>
              </div>

              {/* CRMs */}
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">
                <h3 className="text-xl font-semibold mb-3 text-orange-300">CRMs Externos</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Integração bidirecional com sistemas CRM existentes.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Salesforce
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    HubSpot
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Pipedrive
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Arquitetura 5 Camadas */}
        <section className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
              <Layers className="w-8 h-8 text-cyan-400" />
              3. Arquitetura em 5 Camadas
            </h2>
            
            <div className="space-y-4">
              {[
                { layer: "Camada 1", name: "Conectores", desc: "Portal/Casafari/CRM → ingestion.raw_*" },
                { layer: "Camada 2", name: "Normalização IA", desc: "IA Orquestradora normaliza dados crus" },
                { layer: "Camada 3", name: "Deduplicação", desc: "Embeddings + Image Hashes → PropertyEntity único" },
                { layer: "Camada 4", name: "Engines IA", desc: "Availability, Events, Scores (Angaria/Venda)" },
                { layer: "Camada 5", name: "APIs & Frontend", desc: "Search, Alerts, Opportunities, Tasks" },
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-200">{item.name}</h3>
                    <p className="text-sm text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: IA do Módulo - Scores */}
        <section className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
              <Cpu className="w-8 h-8 text-emerald-400" />
              4. IA do Módulo: Scores
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* AngariaScore */}
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
                <h3 className="text-2xl font-semibold mb-3 text-red-300">AngariaScore (0-100)</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Pontuação para priorizar imóveis com potencial de angariação.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <strong>Recência:</strong> Imóveis recém-publicados (0-40 pts)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <strong>Multi-portal:</strong> Múltiplas fontes (0-30 pts)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <strong>Divergência de preço:</strong> Variação entre portais (0-30 pts)
                  </li>
                </ul>
              </div>

              {/* VendaScore */}
              <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
                <h3 className="text-2xl font-semibold mb-3 text-green-300">VendaScore (0-100)</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Pontuação para priorizar imóveis disponíveis para venda.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <strong>Disponibilidade:</strong> Probabilidade de estar ativo (0-40 pts)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <strong>Recência:</strong> Atualizações recentes (0-30 pts)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <strong>Visibilidade:</strong> Número de portais (0-30 pts)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Modelo Canónico */}
        <section className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
              <GitBranch className="w-8 h-8 text-blue-400" />
              5. Modelo Canónico (Supabase)
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {[
                { table: "properties", desc: "Imóveis Únicos (deduplicated)" },
                { table: "listing_appearances", desc: "Anúncios individuais por portal" },
                { table: "contacts", desc: "Proprietários, compradores, agentes" },
                { table: "opportunities", desc: "Oportunidades ANGARIACAO/VENDA" },
                { table: "tasks", desc: "Tarefas e cadências de follow-up" },
                { table: "alerts", desc: "Alertas personalizados por utilizador" },
                { table: "acm_reports", desc: "Análises Comparativas de Mercado" },
                { table: "market_events", desc: "NEW_ON_MARKET, PRICE_DROP, etc" },
                { table: "property_embeddings", desc: "Vetores para similarity search" },
                { table: "image_hashes", desc: "Hashes perceptuais para dedup visual" },
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <code className="text-blue-300 font-mono font-semibold">{item.table}</code>
                  <p className="text-slate-400 text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: IA Interna (Engines) */}
        <section className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              6. Engines Automáticas (Scheduled)
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "Dedup Engine", freq: "15 min", desc: "Agrupa listings similares em PropertyEntity" },
                { name: "Availability Engine", freq: "1 hora", desc: "Calcula probabilidade de disponibilidade" },
                { name: "Event Engine", freq: "30 min", desc: "Detecta eventos de mercado (price drops, etc)" },
                { name: "Score Engine", freq: "1 hora", desc: "Atualiza AngariaScore e VendaScore" },
              ].map((engine, idx) => (
                <div key={idx} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-yellow-300">{engine.name}</h3>
                    <span className="text-xs bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded-full">
                      {engine.freq}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{engine.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Arquitetura Técnica */}
        <section className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
              <Server className="w-8 h-8 text-purple-400" />
              7. Arquitetura Técnica
            </h2>
            
            <div className="space-y-4">
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
                <h3 className="text-xl font-semibold mb-3 text-purple-300">Backend: Netlify Functions</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-300">
                  <div>• properties-search.ts</div>
                  <div>• properties-get.ts</div>
                  <div>• alerts.ts</div>
                  <div>• acm-generate.ts</div>
                  <div>• opportunities.ts</div>
                  <div>• tasks.ts</div>
                  <div>• integrations-crm-sync.ts</div>
                  <div>• 6 conectores (portais + CRM)</div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
                <h3 className="text-xl font-semibold mb-3 text-blue-300">Database: Supabase PostgreSQL</h3>
                <div className="grid md:grid-cols-3 gap-2 text-sm text-slate-300">
                  <div>• 11 tabelas public</div>
                  <div>• 4 tabelas ingestion</div>
                  <div>• Row Level Security (RLS)</div>
                  <div>• Vector search (pgvector)</div>
                  <div>• PostGIS (geolocation)</div>
                  <div>• Triggers automáticos</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Final */}
        <section>
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 backdrop-blur">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-emerald-100">
                  Status: Arquitetura Completa Implementada
                </h2>
                <p className="text-emerald-50 mb-4">
                  Todos os componentes do módulo foram criados e estão prontos para deploy. 
                  O sistema está preparado para integração com os portais reais e início das operações.
                </p>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                    <div className="font-semibold text-emerald-200">✓ 23 Ficheiros</div>
                    <div className="text-emerald-100 text-xs">APIs, Connectors, Engines</div>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                    <div className="font-semibold text-emerald-200">✓ 15 Tabelas</div>
                    <div className="text-emerald-100 text-xs">Schema completo + RLS</div>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                    <div className="font-semibold text-emerald-200">✓ 4 Engines</div>
                    <div className="text-emerald-100 text-xs">Scheduled functions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}