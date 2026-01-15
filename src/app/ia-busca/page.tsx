"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Home, ArrowUpDown, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { 
  ModeToggle, 
  SearchFilters, 
  PropertyGrid, 
  SearchStats 
} from "@/components/ia-busca";
import { 
  SearchMode, 
  SearchFilters as ISearchFilters, 
  SearchSortBy, 
  SearchResults 
} from "@/types/search";
import { PropertyType, TransactionType } from "@/models/PropertyCanonicalModel";

// Mock data for development
const generateMockResults = (): SearchResults => ({
  items: [
    {
      property: {
        id: "prop-001",
        type: PropertyType.APARTMENT,
        transaction: TransactionType.SALE,
        title: "T3 Moderno em Campo de Ourique",
        description: "Apartamento T3 totalmente remodelado com varanda, cozinha equipada e excelente exposição solar.",
        price: 450000,
        area: 95,
        location: {
          coordinates: { latitude: 38.7196, longitude: -9.1622 },
          address: { distrito: "Lisboa", concelho: "Lisboa", freguesia: "Campo de Ourique" }
        },
        features: { bedrooms: 3, bathrooms: 2, typology: "T3", hasElevator: true, hasBalcony: true },
        images: [],
        sourceInfo: { portal: "Idealista", listingUrl: "https://idealista.pt/mock-001" },
        dataQuality: "HIGH" as const
      },
      score: 92,
      matchReasons: ["Recém-publicado (2 dias)", "Múltiplos portais (3)", "Zona premium"],
      portalsFound: ["Idealista", "Imovirtual", "OLX"],
      duplicateCount: 3,
      highlighted: true
    },
    {
      property: {
        id: "prop-002",
        type: PropertyType.HOUSE,
        transaction: TransactionType.SALE,
        title: "Moradia V4 com Jardim - Cascais",
        description: "Moradia isolada com 4 quartos, jardim privado, garagem para 2 carros e piscina.",
        price: 850000,
        area: 220,
        location: {
          coordinates: { latitude: 38.6973, longitude: -9.4233 },
          address: { distrito: "Lisboa", concelho: "Cascais", freguesia: "Cascais e Estoril" }
        },
        features: { bedrooms: 4, bathrooms: 3, typology: "V4", hasGarage: true, hasGarden: true, hasPool: true },
        images: [],
        sourceInfo: { portal: "Casafari", listingUrl: "https://casafari.com/mock-002" },
        dataQuality: "HIGH" as const
      },
      score: 88,
      matchReasons: ["Zona de alta procura", "Características premium", "Preço competitivo"],
      portalsFound: ["Casafari", "Idealista"],
      duplicateCount: 2,
      highlighted: true
    },
    {
      property: {
        id: "prop-003",
        type: PropertyType.APARTMENT,
        transaction: TransactionType.SALE,
        title: "T2 Renovado - Baixa do Porto",
        description: "Apartamento T2 no centro histórico do Porto, totalmente renovado, próximo à Ribeira.",
        price: 280000,
        area: 75,
        location: {
          coordinates: { latitude: 41.1422, longitude: -8.6115 },
          address: { distrito: "Porto", concelho: "Porto", freguesia: "Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória" }
        },
        features: { bedrooms: 2, bathrooms: 1, typology: "T2", hasElevator: false, hasBalcony: false },
        images: [],
        sourceInfo: { portal: "OLX", listingUrl: "https://olx.pt/mock-003" },
        dataQuality: "MEDIUM" as const
      },
      score: 85,
      matchReasons: ["Centro histórico", "Recém-renovado", "Boa relação preço/m²"],
      portalsFound: ["OLX", "Imovirtual", "Facebook"],
      duplicateCount: 3,
      highlighted: false
    },
    {
      property: {
        id: "prop-004",
        type: PropertyType.APARTMENT,
        transaction: TransactionType.SALE,
        title: "T1 com Vista Rio - Parque das Nações",
        description: "T1 moderno com vista para o Tejo, condomínio fechado com piscina e ginásio.",
        price: 320000,
        area: 55,
        location: {
          coordinates: { latitude: 38.7686, longitude: -9.0947 },
          address: { distrito: "Lisboa", concelho: "Lisboa", freguesia: "Parque das Nações" }
        },
        features: { bedrooms: 1, bathrooms: 1, typology: "T1", hasElevator: true, hasBalcony: true, hasPool: true },
        images: [],
        sourceInfo: { portal: "Idealista", listingUrl: "https://idealista.pt/mock-004" },
        dataQuality: "HIGH" as const
      },
      score: 78,
      matchReasons: ["Condomínio de luxo", "Vista panorâmica", "Zona moderna"],
      portalsFound: ["Idealista", "Casafari"],
      duplicateCount: 2,
      highlighted: false
    },
    {
      property: {
        id: "prop-005",
        type: PropertyType.VILLA,
        transaction: TransactionType.SALE,
        title: "Quinta com 5000m² - Sintra",
        description: "Quinta histórica em Sintra com casa principal restaurada, anexo independente e terreno amplo.",
        price: 1500000,
        area: 350,
        location: {
          coordinates: { latitude: 38.8029, longitude: -9.3817 },
          address: { distrito: "Lisboa", concelho: "Sintra", freguesia: "Sintra (Santa Maria e São Miguel, São Martinho e São Pedro de Penaferrim)" }
        },
        features: { bedrooms: 6, bathrooms: 4, typology: "V6", hasGarage: true, hasGarden: true, landArea: 5000 },
        images: [],
        sourceInfo: { portal: "Casafari", listingUrl: "https://casafari.com/mock-005" },
        dataQuality: "HIGH" as const
      },
      score: 75,
      matchReasons: ["Propriedade única", "Valor histórico", "Grande potencial"],
      portalsFound: ["Casafari", "BPI"],
      duplicateCount: 2,
      highlighted: false
    },
    {
      property: {
        id: "prop-006",
        type: PropertyType.APARTMENT,
        transaction: TransactionType.SALE,
        title: "T3 Duplex - Braga Centro",
        description: "Apartamento T3 duplex em prédio recente, garagem box, terraço privativo.",
        price: 195000,
        area: 120,
        location: {
          coordinates: { latitude: 41.5518, longitude: -8.4229 },
          address: { distrito: "Braga", concelho: "Braga", freguesia: "Braga (São José de São Lázaro e São João do Souto)" }
        },
        features: { bedrooms: 3, bathrooms: 2, typology: "T3", hasElevator: true, hasGarage: true, hasTerrace: true },
        images: [],
        sourceInfo: { portal: "Imovirtual", listingUrl: "https://imovirtual.pt/mock-006" },
        dataQuality: "MEDIUM" as const
      },
      score: 72,
      matchReasons: ["Centro de Braga", "Duplex diferenciado", "Preço atrativo"],
      portalsFound: ["Imovirtual", "OLX"],
      duplicateCount: 2,
      highlighted: false
    },
    {
      property: {
        id: "prop-007",
        type: PropertyType.APARTMENT,
        transaction: TransactionType.SALE,
        title: "T2 Avenida da Liberdade - Lisboa",
        description: "Apartamento clássico numa das avenidas mais emblemáticas de Lisboa, com tetos altos e varanda.",
        price: 620000,
        area: 90,
        location: {
          coordinates: { latitude: 38.7205, longitude: -9.1422 },
          address: { distrito: "Lisboa", concelho: "Lisboa", freguesia: "Santo António" }
        },
        features: { bedrooms: 2, bathrooms: 2, typology: "T2", hasElevator: true, hasBalcony: true },
        images: [],
        sourceInfo: { portal: "Idealista", listingUrl: "https://idealista.pt/mock-007" },
        dataQuality: "HIGH" as const
      },
      score: 68,
      matchReasons: ["Localização premium", "Edifício clássico", "Alta valorização"],
      portalsFound: ["Idealista", "Casafari", "Imovirtual"],
      duplicateCount: 3,
      highlighted: false
    },
    {
      property: {
        id: "prop-008",
        type: PropertyType.HOUSE,
        transaction: TransactionType.SALE,
        title: "Moradia V3 Geminada - Matosinhos",
        description: "Moradia geminada T3 em excelente estado, próximo à praia, com garagem e pequeno jardim.",
        price: 380000,
        area: 140,
        location: {
          coordinates: { latitude: 41.1820, longitude: -8.6896 },
          address: { distrito: "Porto", concelho: "Matosinhos", freguesia: "Matosinhos e Leça da Palmeira" }
        },
        features: { bedrooms: 3, bathrooms: 2, typology: "V3", hasGarage: true, hasGarden: true },
        images: [],
        sourceInfo: { portal: "OLX", listingUrl: "https://olx.pt/mock-008" },
        dataQuality: "MEDIUM" as const
      },
      score: 65,
      matchReasons: ["Próximo à praia", "Zona familiar", "Bom estado conservação"],
      portalsFound: ["OLX", "Imovirtual"],
      duplicateCount: 2,
      highlighted: false
    }
  ],
  total: 42,
  page: 1,
  perPage: 20,
  totalPages: 3,
  stats: {
    totalFound: 42,
    avgPrice: 428125,
    minPrice: 195000,
    maxPrice: 1500000,
    avgArea: 130,
    avgScore: 78,
    portalCounts: { 
      Idealista: 18, 
      OLX: 14, 
      Imovirtual: 16, 
      Casafari: 12, 
      Facebook: 3, 
      BPI: 2 
    },
    typeCounts: { 
      APARTMENT: 28, 
      HOUSE: 10, 
      VILLA: 4 
    },
    distritoCounts: { 
      Lisboa: 24, 
      Porto: 12, 
      Braga: 6 
    }
  }
});

export default function IABuscaPage() {
  const [mode, setMode] = useState<SearchMode>(SearchMode.ANGARIACAO);
  const [filters, setFilters] = useState<ISearchFilters>({});
  const [sortBy, setSortBy] = useState<SearchSortBy>(SearchSortBy.SCORE);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use mock data for now
      const mockResults = generateMockResults();
      setResults(mockResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao realizar busca");
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, mode, page]);

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: ISearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (newSort: SearchSortBy) => {
    setSortBy(newSort);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
          >
            <Home className="w-4 h-4" />
            Voltar para início
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Busca Inteligente de Imóveis
          </h1>
          <p className="text-slate-400">
            Pesquise imóveis com IA em múltiplos portais com scores de Angariação e Venda
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <ModeToggle 
            currentMode={mode} 
            onModeChange={handleModeChange} 
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                loading={loading}
              />
            </div>
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* Stats */}
            {results && (
              <div className="mb-6">
                <SearchStats stats={results.stats} mode={mode} />
              </div>
            )}

            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-400">
                {results ? (
                  <>
                    <span className="font-semibold text-slate-200">{results.total}</span> imóveis encontrados
                  </>
                ) : (
                  "A carregar..."
                )}
              </p>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SearchSortBy)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value={SearchSortBy.SCORE}>Score (Maior primeiro)</option>
                  <option value={SearchSortBy.PRICE_ASC}>Preço (Menor primeiro)</option>
                  <option value={SearchSortBy.PRICE_DESC}>Preço (Maior primeiro)</option>
                  <option value={SearchSortBy.AREA_ASC}>Área (Menor primeiro)</option>
                  <option value={SearchSortBy.AREA_DESC}>Área (Maior primeiro)</option>
                  <option value={SearchSortBy.RECENT}>Mais Recentes</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && !results && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                <p className="text-slate-400">A procurar os melhores imóveis...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-200 mb-2">Erro ao realizar busca</h3>
                    <p className="text-sm text-red-300 mb-4">{error}</p>
                    <button
                      onClick={handleSearch}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-sm font-medium text-red-200 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {results && !loading && (
              <>
                <PropertyGrid 
                  items={results.items} 
                  mode={mode}
                  loading={loading}
                />

                {/* Load More / Pagination */}
                {results.page < results.totalPages && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg font-medium transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          A carregar...
                        </>
                      ) : (
                        <>
                          Carregar mais imóveis
                          <span className="text-xs opacity-80">
                            (Página {results.page} de {results.totalPages})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {results && results.items.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  Nenhum imóvel encontrado
                </h3>
                <p className="text-slate-400 mb-6">
                  Tente ajustar os filtros ou alterar os critérios de busca
                </p>
                <button
                  onClick={() => {
                    setFilters({});
                    handleSearch();
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Limpar filtros
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}