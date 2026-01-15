import { Property } from '@/types/busca-ia';
import { PropertyCard } from './PropertyCard';
import { Flame, TrendingDown, Sparkles, User } from 'lucide-react';

interface SmartListsProps {
  properties: Property[];
}

export function SmartLists({ properties }: SmartListsProps) {
  // Smart Lists para modo Angariação
  const hotToday = properties
    .filter((p) => p.derived_recency <= 1 && p.angaria_score >= 70)
    .slice(0, 5);

  const priceDrops = properties
    .filter((p) => p.events.some((e) => e.type === 'PRICE_DROP'))
    .slice(0, 5);

  const newListings = properties
    .filter((p) => p.derived_recency <= 3)
    .slice(0, 5);

  const likelyPrivate = properties
    .filter((p) => p.portal_count <= 1 && !p.sources.some((s) => s.source_agency))
    .slice(0, 5);

  const lists = [
    {
      title: 'Quentes Hoje',
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      items: hotToday,
      description: 'Atualizados recentemente com score alto',
    },
    {
      title: 'Descidas de Preço',
      icon: TrendingDown,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      items: priceDrops,
      description: 'Imóveis com redução de preço recente',
    },
    {
      title: 'Novos no Mercado',
      icon: Sparkles,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      items: newListings,
      description: 'Publicados nos últimos 3 dias',
    },
    {
      title: 'Possíveis Particulares',
      icon: User,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      items: likelyPrivate,
      description: 'Baixa exposição, sem agência aparente',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Listas Inteligentes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lists.map((list) => (
          <div
            key={list.title}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 ${list.bgColor} border-b border-white/10`}>
              <div className="flex items-center gap-3">
                <list.icon size={24} className={list.color} />
                <div>
                  <h3 className="font-bold text-lg">{list.title}</h3>
                  <p className="text-sm text-slate-400">{list.description}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {list.items.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>Nenhum imóvel nesta categoria</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {list.items.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {property.typology} • {property.area_m2}m²
                        </div>
                        <div className="text-sm text-slate-400">
                          {property.concelho}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          €{(property.price_main / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-emerald-400">
                          Score: {property.angaria_score.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
