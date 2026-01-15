import { Property } from '@/types/busca-ia';
import { X, MapPin, Home, Ruler, Euro, Calendar, Eye, TrendingDown, Clock } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import { ActionButtons } from './ActionButtons';

interface PropertyDetailModalProps {
  property: Property;
  mode: 'angariacao' | 'venda';
  onClose: () => void;
}

export function PropertyDetailModal({
  property,
  mode,
  onClose,
}: PropertyDetailModalProps) {
  const formatPrice = (price: number) => {
    return `€${price.toLocaleString('pt-PT')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/10 bg-slate-950 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">
              {property.typology} • {property.area_m2}m²
            </h2>
            <div className="flex items-center gap-2 text-slate-400 mt-1">
              <MapPin size={16} />
              <span>{property.freguesia}, {property.concelho}, {property.distrito}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score & Price */}
          <div className="flex items-center justify-between">
            <ScoreBadge score={mode === 'angariacao' ? property.angaria_score : property.venda_score} mode={mode} size="lg" />
            <div className="text-right">
              <div className="text-3xl font-bold">{formatPrice(property.price_main)}</div>
              {property.price_divergence_pct > 2 && (
                <div className="text-sm text-yellow-400">
                  Variação: ±{property.price_divergence_pct.toFixed(1)}% entre fontes
                </div>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">Quartos</div>
              <div className="text-2xl font-bold">{property.bedrooms}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">WC</div>
              <div className="text-2xl font-bold">{property.bathrooms}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">Área</div>
              <div className="text-2xl font-bold">{property.area_m2}m²</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-slate-400 text-sm mb-1">Portais</div>
              <div className="text-2xl font-bold">{property.portal_count}</div>
            </div>
          </div>

          {/* Features */}
          {property.features.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">Características</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 rounded-full bg-slate-800 text-sm"
                  >
                    {feature.type.replace('_', ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Eye size={20} />
              Fontes ({property.sources.length})
            </h3>
            <div className="space-y-2">
              {property.sources.map((source, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div>
                    <div className="font-medium capitalize">{source.source_name}</div>
                    <div className="text-xs text-slate-400">
                      Visto há {Math.floor((Date.now() - new Date(source.last_seen).getTime()) / (1000 * 60 * 60 * 24))} dias
                    </div>
                  </div>
                  {source.price && (
                    <div className="font-bold">{formatPrice(source.price)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          {property.events.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Clock size={20} />
                Histórico de Eventos
              </h3>
              <div className="space-y-2">
                {property.events.slice(0, 5).map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{event.type.replace('_', ' ')}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {formatDate(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Reasons */}
          {property.top_reasons.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">Por que este imóvel?</h3>
              <div className="space-y-2">
                {property.top_reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-emerald-200">{reason.reason}</div>
                      <div className="text-xs text-emerald-400 mt-1">
                        Peso: {(reason.weight * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <h3 className="font-bold mb-3">Ações</h3>
            <ActionButtons property={property} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}
