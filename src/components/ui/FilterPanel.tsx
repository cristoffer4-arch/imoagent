/**
 * FilterPanel Component - Painel de filtros avançados
 * Para busca de propriedades
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { X, Search, SlidersHorizontal } from 'lucide-react';

export interface FilterValue {
  typology?: string;
  distrito?: string;
  concelho?: string;
  freguesia?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  areaMin?: number;
  areaMax?: number;
  features?: string[];
}

interface FilterPanelProps {
  filters: FilterValue;
  onChange: (filters: FilterValue) => void;
  onApply?: () => void;
  onReset?: () => void;
  className?: string;
  expanded?: boolean;
}

const TYPOLOGIES = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5+'];
const DISTRITOS = [
  'Lisboa',
  'Porto',
  'Faro',
  'Braga',
  'Coimbra',
  'Setúbal',
  'Aveiro',
  'Viseu',
  'Leiria',
  'Évora',
];

export function FilterPanel({
  filters,
  onChange,
  onApply,
  onReset,
  className,
  expanded: controlledExpanded,
}: FilterPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const handleChange = (key: keyof FilterValue, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onChange({});
    onReset?.();
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Filtros Avançados
          </h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setInternalExpanded(!internalExpanded)}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
        >
          {isExpanded ? 'Ocultar' : 'Expandir'}
        </button>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Typology */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tipologia
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPOLOGIES.map(type => (
                <button
                  key={type}
                  onClick={() => handleChange('typology', filters.typology === type ? undefined : type)}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    filters.typology === type
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Distrito
              </label>
              <select
                value={filters.distrito || ''}
                onChange={(e) => handleChange('distrito', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todos</option>
                {DISTRITOS.map(distrito => (
                  <option key={distrito} value={distrito}>{distrito}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Concelho
              </label>
              <input
                type="text"
                value={filters.concelho || ''}
                onChange={(e) => handleChange('concelho', e.target.value || undefined)}
                placeholder="Digite o concelho"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Freguesia
              </label>
              <input
                type="text"
                value={filters.freguesia || ''}
                onChange={(e) => handleChange('freguesia', e.target.value || undefined)}
                placeholder="Digite a freguesia"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preço (€)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.priceMin || ''}
                onChange={(e) => handleChange('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Mínimo"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                value={filters.priceMax || ''}
                onChange={(e) => handleChange('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Máximo"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Area Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Área (m²)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.areaMin || ''}
                onChange={(e) => handleChange('areaMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Mínimo"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                value={filters.areaMax || ''}
                onChange={(e) => handleChange('areaMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Máximo"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Quartos
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => handleChange('bedrooms', filters.bedrooms === num ? undefined : num)}
                  className={clsx(
                    'px-4 py-2 text-sm rounded-lg transition-colors',
                    filters.bedrooms === num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  )}
                >
                  {num}+
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={onApply}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
