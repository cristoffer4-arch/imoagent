'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Property, SearchFilters as SearchFiltersType } from '@/types/busca-ia';
import { ModeSelector } from '@/components/ia-busca/ModeSelector';
import { SearchFiltersComponent } from '@/components/ia-busca/SearchFilters';
import { PropertyList } from '@/components/ia-busca/PropertyList';
import { PropertyMap } from '@/components/ia-busca/PropertyMap';
import { SmartLists } from '@/components/ia-busca/SmartLists';
import { PropertyDetailModal } from '@/components/ia-busca/PropertyDetailModal';
import { Search, Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

export default function IABuscaPage() {
  const [mode, setMode] = useState<'angariacao' | 'venda'>('angariacao');
  const [filters, setFilters] = useState<SearchFiltersType>({
    mode: 'angariacao',
    typology: [],
    min_score: 0,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Update filters when mode changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, mode }));
  }, [mode]);

  // Fetch properties on mount and when filters change
  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        mode: filters.mode,
        ...(filters.location?.concelho && { concelho: filters.location.concelho }),
        ...(filters.typology && filters.typology.length > 0 && { typology: filters.typology.join(',') }),
        ...(filters.price_range && {
          priceMin: filters.price_range[0].toString(),
          priceMax: filters.price_range[1].toString(),
        }),
        ...(filters.area_range && {
          areaMin: filters.area_range[0].toString(),
          areaMax: filters.area_range[1].toString(),
        }),
        ...(filters.min_score && { minScore: filters.min_score.toString() }),
      });

      const response = await fetch(`/api/ia-busca/properties/search?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-2"
              >
                ← Voltar
              </Link>
              <h1 className="text-3xl font-bold">IA Busca de Imóveis</h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
                  Gemini AI
                </div>
                <div className="text-sm text-slate-400">
                  {properties.length} imóveis encontrados
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-4">
            <ModeSelector mode={mode} onChange={setMode} />
            <button
              onClick={() => setShowMap(!showMap)}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium transition"
            >
              {showMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <SearchFiltersComponent
            filters={filters}
            onChange={setFilters}
            mode={mode}
          />

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={48} className="animate-spin text-emerald-500" />
            </div>
          )}

          {/* Map (if enabled) */}
          {showMap && !loading && (
            <PropertyMap
              properties={properties}
              onPropertySelect={setSelectedProperty}
            />
          )}

          {/* Property List */}
          {!loading && (
            <PropertyList
              properties={properties}
              mode={mode}
              onPropertyClick={setSelectedProperty}
            />
          )}

          {/* Smart Lists (only in angariacao mode) */}
          {!loading && mode === 'angariacao' && properties.length > 0 && (
            <SmartLists properties={properties} />
          )}
        </div>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          mode={mode}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-white/10 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center text-sm text-slate-400">
            <p>
              IA Busca - Motor de pesquisa inteligente com dados de 7+ portais
              portugueses
            </p>
            <p className="mt-2">
              OLX • Facebook • Idealista • BPI • Casa Sapo • Imovirtual •
              Casafari
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}