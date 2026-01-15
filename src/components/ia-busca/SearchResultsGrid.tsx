/**
 * SearchResultsGrid - Grid display with advanced filters
 * Mobile-first responsive design with filtering capabilities
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { PropertyMatchCard } from './PropertyMatchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PropertyMatch } from '@/services/notifications';

interface SearchFilters {
  searchTerm: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  minBedrooms: number;
  minBathrooms: number;
  location: string;
  minMatchScore: number;
  sortBy: 'matchScore' | 'price' | 'area' | 'angariaScore' | 'vendaScore';
  sortDirection: 'asc' | 'desc';
}

interface SearchResultsGridProps {
  properties: PropertyMatch[];
  onViewDetails?: (propertyId: string) => void;
  onContact?: (propertyId: string) => void;
  loading?: boolean;
}

export function SearchResultsGrid({ 
  properties, 
  onViewDetails, 
  onContact,
  loading = false 
}: SearchResultsGridProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    minPrice: 0,
    maxPrice: 10000000,
    minArea: 0,
    maxArea: 10000,
    minBedrooms: 0,
    minBathrooms: 0,
    location: '',
    minMatchScore: 0,
    sortBy: 'matchScore',
    sortDirection: 'desc',
  });

  // Apply filters and sorting
  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.property.title.toLowerCase().includes(term) ||
        p.property.location.toLowerCase().includes(term)
      );
    }

    // Price range
    filtered = filtered.filter(p => 
      p.property.price >= filters.minPrice && 
      p.property.price <= filters.maxPrice
    );

    // Area range
    filtered = filtered.filter(p => 
      p.property.area >= filters.minArea && 
      p.property.area <= filters.maxArea
    );

    // Bedrooms
    if (filters.minBedrooms > 0) {
      filtered = filtered.filter(p => p.property.bedrooms >= filters.minBedrooms);
    }

    // Bathrooms
    if (filters.minBathrooms > 0) {
      filtered = filtered.filter(p => p.property.bathrooms >= filters.minBathrooms);
    }

    // Location
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filtered = filtered.filter(p => 
        p.property.location.toLowerCase().includes(location)
      );
    }

    // Match score
    if (filters.minMatchScore > 0) {
      filtered = filtered.filter(p => p.matchScore >= filters.minMatchScore);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: number, bVal: number;
      
      switch (filters.sortBy) {
        case 'matchScore':
          aVal = a.matchScore;
          bVal = b.matchScore;
          break;
        case 'price':
          aVal = a.property.price;
          bVal = b.property.price;
          break;
        case 'area':
          aVal = a.property.area;
          bVal = b.property.area;
          break;
        case 'angariaScore':
          aVal = a.property.angariaScore || 0;
          bVal = b.property.angariaScore || 0;
          break;
        case 'vendaScore':
          aVal = a.property.vendaScore || 0;
          bVal = b.property.vendaScore || 0;
          break;
        default:
          return 0;
      }

      return filters.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [properties, filters]);

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      minPrice: 0,
      maxPrice: 10000000,
      minArea: 0,
      maxArea: 10000,
      minBedrooms: 0,
      minBathrooms: 0,
      location: '',
      minMatchScore: 0,
      sortBy: 'matchScore',
      sortDirection: 'desc',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.minPrice > 0) count++;
    if (filters.maxPrice < 10000000) count++;
    if (filters.minArea > 0) count++;
    if (filters.maxArea < 10000) count++;
    if (filters.minBedrooms > 0) count++;
    if (filters.minBathrooms > 0) count++;
    if (filters.location) count++;
    if (filters.minMatchScore > 0) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Pesquisar imóveis..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg text-slate-100">Filtros Avançados</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Preço Mínimo (€)</label>
                <Input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Preço Máximo (€)</label>
                <Input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            {/* Area Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Área Mínima (m²)</label>
                <Input
                  type="number"
                  value={filters.minArea}
                  onChange={(e) => setFilters(prev => ({ ...prev, minArea: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Área Máxima (m²)</label>
                <Input
                  type="number"
                  value={filters.maxArea}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxArea: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            {/* Bedrooms and Bathrooms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Quartos Mínimos</label>
                <Input
                  type="number"
                  value={filters.minBedrooms}
                  onChange={(e) => setFilters(prev => ({ ...prev, minBedrooms: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Casas de Banho Mínimas</label>
                <Input
                  type="number"
                  value={filters.minBathrooms}
                  onChange={(e) => setFilters(prev => ({ ...prev, minBathrooms: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localização
              </label>
              <Input
                type="text"
                placeholder="Lisboa, Porto, etc."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            {/* Match Score */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Score Mínimo de Match</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={filters.minMatchScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minMatchScore: Number(e.target.value) }))}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Ordenar Por</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SearchFilters['sortBy'] }))}
                  className="w-full rounded-xl bg-slate-800 border-slate-700 text-slate-100 px-4 py-2"
                >
                  <option value="matchScore">Score de Match</option>
                  <option value="price">Preço</option>
                  <option value="area">Área</option>
                  <option value="angariaScore">Score Angariação</option>
                  <option value="vendaScore">Score Venda</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Direção</label>
                <select
                  value={filters.sortDirection}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortDirection: e.target.value as 'asc' | 'desc' }))}
                  className="w-full rounded-xl bg-slate-800 border-slate-700 text-slate-100 px-4 py-2"
                >
                  <option value="desc">Maior para Menor</option>
                  <option value="asc">Menor para Maior</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex-1"
              >
                Limpar Filtros
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowFilters(false)}
                className="flex-1"
              >
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <div>
          {filteredProperties.length} {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpar {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-slate-400">A carregar imóveis...</p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && filteredProperties.length === 0 && (
        <Card className="bg-slate-900 border-slate-700 p-12 text-center">
          <p className="text-slate-400 text-lg">Nenhum imóvel encontrado com os critérios selecionados.</p>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={resetFilters}
              className="mt-4"
            >
              Limpar Filtros
            </Button>
          )}
        </Card>
      )}

      {!loading && filteredProperties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((match) => (
            <PropertyMatchCard
              key={match.propertyId}
              match={match}
              onViewDetails={onViewDetails}
              onContact={onContact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
