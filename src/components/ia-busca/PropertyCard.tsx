import { Property } from '@/types/busca-ia';
import { ScoreBadge } from './ScoreBadge';
import { MapPin, Home, Ruler, Calendar, TrendingDown, Eye } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  mode: 'angariacao' | 'venda';
  onClick: () => void;
}

export function PropertyCard({ property, mode, onClick }: PropertyCardProps) {
  const score = mode === 'angariacao' ? property.angaria_score : property.venda_score;
  
  // Format price
  const formatPrice = (price: number) => {
    return `€${(price / 1000).toFixed(0)}k`;
  };

  // Get relevant events for display
  const recentEvents = property.events
    .filter((e) => ['PRICE_DROP', 'NEW_ON_MARKET', 'BACK_ON_MARKET'].includes(e.type))
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition-all cursor-pointer overflow-hidden"
    >
      {/* Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <Home size={48} className="text-slate-600" />
        {property.derived_recency <= 3 && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
            NOVO
          </div>
        )}
        <div className="absolute top-3 right-3">
          <ScoreBadge score={score} mode={mode} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg group-hover:text-emerald-400 transition">
              {property.typology} • {property.area_m2}m²
            </h3>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <MapPin size={14} />
              <span>{property.freguesia}, {property.concelho}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl">{formatPrice(property.price_main)}</div>
            {property.price_divergence_pct > 2 && (
              <div className="text-xs text-yellow-400">
                ±{property.price_divergence_pct.toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span>{property.bedrooms} quartos</span>
          <span>•</span>
          <span>{property.bathrooms} WC</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {property.portal_count} portais
          </span>
        </div>

        {/* Events */}
        {recentEvents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recentEvents.map((event, idx) => (
              <div
                key={idx}
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  event.type === 'PRICE_DROP'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {event.type === 'PRICE_DROP' && (
                  <span className="flex items-center gap-1">
                    <TrendingDown size={12} />
                    Descida de preço
                  </span>
                )}
                {event.type === 'NEW_ON_MARKET' && 'Novo no mercado'}
                {event.type === 'BACK_ON_MARKET' && 'Volta ao mercado'}
              </div>
            ))}
          </div>
        )}

        {/* Top Reasons */}
        {property.top_reasons.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-slate-400">
              {property.top_reasons[0]?.reason}
            </div>
          </div>
        )}

        {/* Recency */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar size={12} />
          <span>
            {property.derived_recency === 0
              ? 'Atualizado hoje'
              : `Há ${property.derived_recency} dias`}
          </span>
        </div>
      </div>
    </div>
  );
}
