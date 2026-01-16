"use client";

import { Search, AlertCircle, Loader2 } from "lucide-react";
import { SearchResultItem } from "@/types/search";
import { PropertyCard } from "./PropertyCard";

/**
 * Props para o componente PropertyGrid
 */
interface PropertyGridProps {
  /** Lista de resultados de propriedades */
  properties: SearchResultItem[];
  /** Estado de carregamento */
  loading: boolean;
  /** Mensagem de erro (opcional) */
  error?: string;
  /** Callback para carregar mais resultados */
  onLoadMore?: () => void;
  /** Flag indicando se há mais resultados para carregar */
  hasMore?: boolean;
  /** Flag indicando se está carregando mais resultados */
  loadingMore?: boolean;
}

/**
 * PropertyGrid - Grid de resultados com estados
 * 
 * Exibe a lista de propriedades encontradas com suporte a:
 * - Estado de carregamento (skeleton loaders)
 * - Estado vazio (nenhum resultado)
 * - Estado de erro
 * - Paginação (carregar mais)
 */
export function PropertyGrid({
  properties,
  loading,
  error,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: PropertyGridProps) {
  // Estado de carregamento inicial
  if (loading && properties.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-red-500/10 rounded-full p-4 mb-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-50 mb-2">
          Erro ao carregar imóveis
        </h3>
        <p className="text-slate-400 text-center max-w-md mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Estado vazio
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-slate-800 rounded-full p-4 mb-4">
          <Search className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-50 mb-2">
          Nenhum imóvel encontrado
        </h3>
        <p className="text-slate-400 text-center max-w-md">
          Tente ajustar os filtros ou alterar o modo de busca para encontrar mais
          resultados.
        </p>
      </div>
    );
  }

  // Estado com resultados
  return (
    <div className="space-y-6">
      {/* Grid de propriedades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((item) => (
          <PropertyCard
            key={item.property.id}
            property={item.property}
            score={item.score}
            matchReasons={item.matchReasons}
            portals={item.portalsFound}
            onClick={() => {
              // Aqui você pode adicionar navegação para detalhes do imóvel
              console.log("Property clicked:", item.property.id);
            }}
          />
        ))}
      </div>

      {/* Botão Carregar Mais */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className={`
              px-8 py-3 bg-slate-800 text-slate-200 rounded-xl font-medium
              border border-slate-700 transition-all duration-200
              hover:bg-slate-750 hover:border-slate-600
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            `}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Carregando...</span>
              </>
            ) : (
              <span>Carregar mais imóveis</span>
            )}
          </button>
        </div>
      )}

      {/* Skeleton loaders durante carregamento de mais resultados */}
      {loadingMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={`loading-${index}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SkeletonCard - Card de carregamento animado
 */
function SkeletonCard() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden animate-pulse">
      {/* Imagem skeleton */}
      <div className="aspect-video bg-slate-800" />

      {/* Conteúdo skeleton */}
      <div className="p-4 space-y-3">
        {/* Tipo */}
        <div className="h-4 w-24 bg-slate-800 rounded" />

        {/* Título */}
        <div className="h-6 w-full bg-slate-800 rounded" />

        {/* Localização */}
        <div className="h-4 w-3/4 bg-slate-800 rounded" />

        {/* Preço */}
        <div className="h-8 w-32 bg-slate-800 rounded" />

        {/* Características */}
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-slate-800 rounded" />
        </div>

        {/* Razões */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="h-3 w-full bg-slate-800 rounded" />
          <div className="h-3 w-5/6 bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
}
