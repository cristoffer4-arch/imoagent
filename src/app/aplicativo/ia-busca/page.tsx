'use client'

import { useState } from 'react'
import { Search, MapPin, Euro, Home, Filter, TrendingUp, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PORTALS = [
  { id: 'idealista', name: 'Idealista', checked: true },
  { id: 'imovirtual', name: 'Imovirtual', checked: true },
  { id: 'olx', name: 'OLX', checked: true },
  { id: 'casasapo', name: 'Casa Sapo', checked: true },
  { id: 'bpi', name: 'BPI Expresso Imobiliário', checked: false },
  { id: 'facebook', name: 'Facebook Marketplace', checked: false },
  { id: 'casafari', name: 'Casafari', checked: false },
]

const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Apartamento T2 Moderno',
    location: 'Lisboa, Parque das Nações',
    price: 385000,
    type: 'Venda',
    typology: 'T2',
    area: 85,
    portal: 'Idealista',
    image: '🏢',
  },
  {
    id: 2,
    title: 'Moradia T3 com Jardim',
    location: 'Porto, Foz do Douro',
    price: 550000,
    type: 'Venda',
    typology: 'T3',
    area: 150,
    portal: 'Imovirtual',
    image: '🏡',
  },
  {
    id: 3,
    title: 'Apartamento T1 Centro',
    location: 'Lisboa, Chiado',
    price: 1200,
    type: 'Arrendamento',
    typology: 'T1',
    area: 55,
    portal: 'OLX',
    image: '🏠',
  },
]

export default function IABuscaPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [propertyType, setPropertyType] = useState('venda')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [typology, setTypology] = useState('')
  const [portals, setPortals] = useState(PORTALS)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<typeof MOCK_PROPERTIES>([])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      setResults(MOCK_PROPERTIES)
      setSearching(false)
    }, 1500)
  }

  const togglePortal = (id: string) => {
    setPortals(portals.map(p => p.id === id ? { ...p, checked: !p.checked } : p))
  }

  const selectedPortalsCount = portals.filter(p => p.checked).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-blue-100/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Busca Inteligente</h1>
          <p className="text-gray-700">Centralize pesquisas em 7+ portais imobiliários com deduplicação e mapas em tempo real.</p>
        </div>

        {/* Search Section */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-blue-100/70 p-8 backdrop-blur-sm space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Pesquisa Principal
          </h2>
          
          <Input
            placeholder="Ex: Apartamento T2 em Lisboa com varanda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-lg h-14"
          />

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="venda">Venda</option>
                <option value="arrendamento">Arrendamento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço Mínimo</label>
              <Input
                type="number"
                placeholder="€ Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço Máximo</label>
              <Input
                type="number"
                placeholder="€ Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipologia</label>
              <select
                value={typology}
                onChange={(e) => setTypology(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Todas</option>
                <option value="T0">T0</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T3">T3</option>
                <option value="T4">T4</option>
                <option value="T5+">T5+</option>
              </select>
            </div>
          </div>

          {/* Portals Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Portais Integrados ({selectedPortalsCount} selecionados)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {portals.map((portal) => (
                <label
                  key={portal.id}
                  className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={portal.checked}
                    onChange={() => togglePortal(portal.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{portal.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                A pesquisar em {selectedPortalsCount} portais...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Iniciar Busca Inteligente
              </>
            )}
          </Button>
        </div>

        {/* Statistics */}
        {results.length > 0 && (
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{results.length} Propriedades Encontradas</h3>
                <p className="text-blue-100 mt-1">em {selectedPortalsCount} portais diferentes</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Resultados da Pesquisa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((property) => (
                <div
                  key={property.id}
                  className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-blue-100/70 p-6 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className="text-6xl mb-4 text-center">{property.image}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      {property.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">
                        {property.type === 'Venda'
                          ? `€${property.price.toLocaleString('pt-PT')}`
                          : `€${property.price}/mês`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-purple-600" />
                      {property.typology} • {property.area}m²
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {property.portal}
                    </span>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        {results.length > 0 && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-blue-100/70 p-8 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Mapa de Localizações
            </h2>
            <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Mapa interativo em desenvolvimento</p>
                <p className="text-sm text-gray-500 mt-2">Visualização geográfica das propriedades encontradas</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
