/**
 * PropertyMatchCard - Card para exibir propriedades com match score
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';
import { MapPin, Home, Bed, Bath, Square, TrendingDown, TrendingUp, ExternalLink, Heart, Share2 } from 'lucide-react';
import { ScoreBadge } from '../ui/Badge';
import { MatchScore } from '@/services/notifications/types';

export interface PropertyMatch {
  id: string;
  title?: string;
  typology?: string;
  location: {
    distrito: string;
    concelho: string;
    freguesia?: string;
  };
  price: number;
  priceChange?: {
    oldPrice: number;
    percentChange: number;
  };
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  matchScore?: MatchScore;
  portalCount?: number;
  sources?: Array<{
    name: string;
    url?: string;
  }>;
  firstSeen?: Date;
  lastSeen?: Date;
}

interface PropertyMatchCardProps {
  property: PropertyMatch;
  onView?: (propertyId: string) => void;
  onFavorite?: (propertyId: string) => void;
  onShare?: (propertyId: string) => void;
  className?: string;
}

export function PropertyMatchCard({
  property,
  onView,
  onFavorite,
  onShare,
  className,
}: PropertyMatchCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return '/placeholder-property.jpg';
    if (url.startsWith('http')) return url;
    return `/images/properties/${url}`;
  };

  const mainImage = property.images?.[0];
  const hasPriceChange = property.priceChange && property.priceChange.percentChange !== 0;
  const isPriceDrop = hasPriceChange && property.priceChange!.percentChange < 0;

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
        'border border-slate-200 dark:border-slate-700 overflow-hidden',
        'group cursor-pointer',
        className
      )}
      onClick={() => onView?.(property.id)}
    >
      {/* Image */}
      <div className="relative h-48 bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <img
          src={getImageUrl(mainImage)}
          alt={property.title || 'Propriedade'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
          }}
        />
        
        {/* Match Score Badge */}
        {property.matchScore && (
          <div className="absolute top-3 left-3">
            <ScoreBadge score={property.matchScore.overall} size="lg" />
          </div>
        )}

        {/* Price Change Badge */}
        {hasPriceChange && (
          <div className="absolute top-3 right-3">
            <div
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1',
                isPriceDrop
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              )}
            >
              {isPriceDrop ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {Math.abs(property.priceChange!.percentChange).toFixed(1)}%
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(property.id);
            }}
            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            aria-label="Adicionar aos favoritos"
          >
            <Heart className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(property.id);
            }}
            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            aria-label="Partilhar"
          >
            <Share2 className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Location */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
            {property.title || `${property.typology || 'Imóvel'} em ${property.location.concelho}`}
          </h3>
          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">
              {property.location.freguesia
                ? `${property.location.freguesia}, ${property.location.concelho}`
                : `${property.location.concelho}, ${property.location.distrito}`}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatPrice(property.price)}
          </div>
          {hasPriceChange && (
            <div className="text-sm text-slate-500 dark:text-slate-400 line-through">
              {formatPrice(property.priceChange!.oldPrice)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
          {property.typology && (
            <div className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              <span>{property.typology}</span>
            </div>
          )}
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area !== undefined && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{property.area}m²</span>
            </div>
          )}
        </div>

        {/* Match Reasons */}
        {property.matchScore?.reasons && property.matchScore.reasons.length > 0 && (
          <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">
              Porquê este match?
            </p>
            <ul className="space-y-1">
              {property.matchScore.reasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start">
                  <span className="mr-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer - Sources */}
        {property.portalCount && property.portalCount > 1 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Disponível em {property.portalCount} portais</span>
              {property.sources && property.sources.length > 0 && (
                <div className="flex gap-1">
                  {property.sources.slice(0, 3).map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400"
                      title={source.name}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
