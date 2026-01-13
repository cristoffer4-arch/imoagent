'use client'

import { useState } from 'react'
import { TrendingUp, Plus, Eye, MousePointer, Sparkles, BarChart3, Image as ImageIcon, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MOCK_LISTINGS = [
  {
    id: 1,
    title: 'Apartamento T2 Moderno em Lisboa',
    price: 385000,
    portal: 'Idealista',
    views: 1243,
    clicks: 87,
    ctr: 7.0,
    status: 'Ativo',
    daysOnline: 12,
    image: '🏢',
  },
  {
    id: 2,
    title: 'Moradia T3 com Jardim no Porto',
    price: 550000,
    portal: 'Imovirtual',
    views: 856,
    clicks: 54,
    ctr: 6.3,
    status: 'Ativo',
    daysOnline: 8,
    image: '🏡',
  },
  {
    id: 3,
    title: 'Apartamento T1 Centro Histórico',
    price: 1200,
    portal: 'OLX',
    views: 2105,
    clicks: 145,
    ctr: 6.9,
    status: 'Pausado',
    daysOnline: 25,
    image: '🏠',
  },
]

const AI_SUGGESTIONS = [
  {
    id: 1,
    type: 'title',
    icon: '✨',
    original: 'Apartamento T2 em Lisboa',
    suggested: 'Apartamento T2 Moderno com Vista Rio em Lisboa - Parque das Nações',
    impact: '+35% CTR esperado',
    color: 'blue',
  },
  {
    id: 2,
    type: 'price',
    icon: '💰',
    original: '€395,000',
    suggested: '€389,900',
    impact: '+15% interesse (psicologia de preço)',
    color: 'green',
  },
  {
    id: 3,
    type: 'description',
    icon: '📝',
    original: 'Bom apartamento com 2 quartos',
    suggested: 'Descubra o seu novo lar! Apartamento T2 com acabamentos premium, varanda ampla e luz natural abundante. Cozinha equipada, 2 casas de banho modernas. Localização privilegiada próximo a transportes e comércio.',
    impact: '+28% engagement',
    color: 'purple',
  },
]

export default function IAAnunciosIdealistaPage() {
  const [showNewListing, setShowNewListing] = useState(false)
  const [selectedListing, setSelectedListing] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-green-100/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 Anúncios Idealista</h1>
          <p className="text-gray-700">Optimize anúncios para Idealista e outros portais com sugestões criativas e A/B tests.</p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8" />
              <span className="text-3xl font-bold">4.2K</span>
            </div>
            <p className="text-sm font-medium text-blue-100">Total de Visualizações</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="w-8 h-8" />
              <span className="text-3xl font-bold">286</span>
            </div>
            <p className="text-sm font-medium text-green-100">Cliques Totais</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <span className="text-3xl font-bold">6.8%</span>
            </div>
            <p className="text-sm font-medium text-purple-100">Taxa de Conversão (CTR)</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8" />
              <span className="text-3xl font-bold">15d</span>
            </div>
            <p className="text-sm font-medium text-orange-100">Tempo Médio Venda</p>
          </div>
        </div>

        {/* New Listing Button */}
        {!showNewListing && (
          <Button
            onClick={() => setShowNewListing(true)}
            className="w-full h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Novo Anúncio
          </Button>
        )}

        {/* New Listing Form */}
        {showNewListing && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-green-100/70 p-8 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Criar Novo Anúncio</h2>
              <Button variant="ghost" onClick={() => setShowNewListing(false)}>
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título do Anúncio</label>
                <Input placeholder="Ex: Apartamento T2 Moderno em Lisboa" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                  <Input type="number" placeholder="€" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portal</label>
                  <select className="w-full h-10 rounded-xl border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                    <option>Idealista</option>
                    <option>Imovirtual</option>
                    <option>OLX</option>
                    <option>Casa Sapo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Descreva os detalhes do imóvel..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fotos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Clique para adicionar fotos ou arraste aqui</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipologia</label>
                  <select className="w-full h-10 rounded-xl border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                    <option>T2</option>
                    <option>T1</option>
                    <option>T3</option>
                    <option>T4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
                  <Input type="number" placeholder="85" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quartos</label>
                  <Input type="number" placeholder="2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WC</label>
                  <Input type="number" placeholder="2" />
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <Sparkles className="w-5 h-5 mr-2" />
                Criar Anúncio com IA
              </Button>
            </div>
          </div>
        )}

        {/* Active Listings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Anúncios Ativos</h2>
          <div className="grid grid-cols-1 gap-6">
            {MOCK_LISTINGS.map((listing) => (
              <div
                key={listing.id}
                className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-green-100/70 p-6 backdrop-blur-sm hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-6">
                  {/* Image */}
                  <div className="text-7xl">{listing.image}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{listing.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="font-bold text-green-600 text-xl">€{listing.price.toLocaleString('pt-PT')}</span>
                          <span>•</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {listing.portal}
                          </span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedListing(selectedListing === listing.id ? null : listing.id)}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Otimizar
                      </Button>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-medium">Visualizações</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{listing.views}</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                          <MousePointer className="w-4 h-4" />
                          <span className="text-xs font-medium">Cliques</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{listing.clicks}</div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-medium">CTR</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{listing.ctr}%</div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                          <BarChart3 className="w-4 h-4" />
                          <span className="text-xs font-medium">Dias Online</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{listing.daysOnline}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions (expanded) */}
                {selectedListing === listing.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Sugestões de Otimização IA
                    </h4>
                    {AI_SUGGESTIONS.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={`p-4 rounded-2xl bg-gradient-to-r from-${suggestion.color}-50 to-${suggestion.color}-100`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{suggestion.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 capitalize">{suggestion.type}</h5>
                              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                {suggestion.impact}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Atual:</p>
                                <p className="text-sm text-gray-800">{suggestion.original}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Sugerido:</p>
                                <p className="text-sm font-medium text-gray-900">{suggestion.suggested}</p>
                              </div>
                            </div>
                            <Button size="sm" className="mt-3" variant="outline">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Aplicar Sugestão
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
