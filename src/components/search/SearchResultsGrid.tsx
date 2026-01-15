/**
 * SearchResultsGrid - Grid de resultados de busca com filtros avançados
 */

'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Loader2, Grid3x3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyMatchCard, PropertyMatch } from './PropertyMatchCard';
import { FilterPanel, FilterValue } from '../ui/FilterPanel';

interface SearchResultsGridProps {
  onSearch?: (filters: FilterValue, page: number) => Promise<{ properties: PropertyMatch[]; total: number }>;
  onViewProperty?: (propertyId: string) => void;
  onFavoriteProperty?: (propertyId: string) => void;
  onShareProperty?: (propertyId: string) => void;
  initialFilters?: FilterValue;
  className?: string;
}

export function SearchResultsGrid({
  onSearch,
  onViewProperty,
  onFavoriteProperty,
  onShareProperty,
  initialFilters = {},
  className,
}: SearchResultsGridProps) {
  const [filters, setFilters] = useState<FilterValue>(initialFilters);
  const [properties, setProperties] = useState<PropertyMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 12;

  const totalPages = Math.ceil(total / perPage);

  useEffect(() => {
    performSearch();
  }, [page]);

  const performSearch = async () => {
    if (!onSearch) return;

    setLoading(true);
    try {
      const result = await onSearch(filters, page);
      setProperties(result.properties);
      setTotal(result.total);
    } catch (error) {
      console.error('Error searching properties:', error);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    performSearch();
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Filters */}
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Resultados da Busca
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {loading ? 'A carregar...' : `${total} imóveis encontrados`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded transition-colors',
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            aria-label="Vista de grelha"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded transition-colors',
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            aria-label="Vista de lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      )}

      {/* Results Grid */}
      {!loading && properties.length > 0 && (
        <>
          <div
            className={clsx(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}
          >
            {properties.map((property) => (
              <PropertyMatchCard
                key={property.id}
                property={property}
                onView={onViewProperty}
                onFavorite={onFavoriteProperty}
                onShare={onShareProperty}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                    page === 1
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                    page === totalPages
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  )}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && properties.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 dark:text-slate-600 mb-4">
            <svg
              className="w-24 h-24 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Nenhum imóvel encontrado
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Tente ajustar os filtros de busca
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
