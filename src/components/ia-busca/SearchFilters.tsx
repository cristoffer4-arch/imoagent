import { useState } from 'react';
import { SearchFilters } from '@/types/busca-ia';
import { MapPin, Home, Ruler, Euro, Star, Filter } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  mode: 'angariacao' | 'venda';
}

const CONCELHOS = [
  'Lisboa',
  'Porto',
  'Cascais',
  'Sintra',
  'Oeiras',
  'Braga',
  'Coimbra',
  'Faro',
];

const TYPOLOGIES = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5+'];

export function SearchFiltersComponent({
  filters,
  onChange,
  mode,
}: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const updateFilter = (key: string, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const updateLocation = (key: string, value: string) => {
    onChange({
      ...filters,
      location: { ...filters.location, [key]: value },
    });
  };

  const toggleTypology = (typology: string) => {
    const current = filters.typology || [];
    const updated = current.includes(typology)
      ? current.filter((t) => t !== typology)
      : [...current, typology];
    updateFilter('typology', updated);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Filter size={20} />
          <span>Filtros de Busca</span>
        </div>
        <span className="text-sm text-slate-400">
          {expanded ? 'Ocultar' : 'Expandir'}
        </span>
      </button>

      {/* Filters Content */}
      {expanded && (
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin size={16} />
              <span>Localização</span>
            </label>
            <select
              value={filters.location?.concelho || ''}
              onChange={(e) => updateLocation('concelho', e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todos os Concelhos</option>
              {CONCELHOS.map((concelho) => (
                <option key={concelho} value={concelho}>
                  {concelho}
                </option>
              ))}
            </select>
          </div>

          {/* Typology */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Home size={16} />
              <span>Tipologia</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPOLOGIES.map((typology) => (
                <button
                  key={typology}
                  onClick={() => toggleTypology(typology)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    (filters.typology || []).includes(typology)
                      ? mode === 'angariacao'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {typology}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Euro size={16} />
              <span>Preço (€)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.price_range?.[0] || ''}
                onChange={(e) =>
                  updateFilter('price_range', [
                    parseInt(e.target.value) || 0,
                    filters.price_range?.[1] || 1000000,
                  ])
                }
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.price_range?.[1] || ''}
                onChange={(e) =>
                  updateFilter('price_range', [
                    filters.price_range?.[0] || 0,
                    parseInt(e.target.value) || 1000000,
                  ])
                }
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Area Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Ruler size={16} />
              <span>Área (m²)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.area_range?.[0] || ''}
                onChange={(e) =>
                  updateFilter('area_range', [
                    parseInt(e.target.value) || 0,
                    filters.area_range?.[1] || 500,
                  ])
                }
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.area_range?.[1] || ''}
                onChange={(e) =>
                  updateFilter('area_range', [
                    filters.area_range?.[0] || 0,
                    parseInt(e.target.value) || 500,
                  ])
                }
                className="px-4 py-2 rounded-lg bg-slate-900/50 border border-white/10 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Min Score */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Star size={16} />
              <span>Score Mínimo: {filters.min_score || 0}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.min_score || 0}
              onChange={(e) =>
                updateFilter('min_score', parseInt(e.target.value))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() =>
              onChange({ mode: filters.mode, typology: [], min_score: 0 })
            }
            className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
