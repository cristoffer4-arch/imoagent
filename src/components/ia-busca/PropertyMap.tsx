import { Property } from '@/types/busca-ia';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

export function PropertyMap({ properties, onPropertySelect }: PropertyMapProps) {
  // Mock map for MVP - in production use Leaflet or similar
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="font-bold flex items-center gap-2">
          <MapPin size={20} />
          <span>Mapa de Imóveis</span>
        </h2>
      </div>
      
      <div className="relative h-[400px] bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Mock map visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <MapPin size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Mapa Interativo</p>
            <p className="text-sm mt-2">
              {properties.length} imóveis marcados no mapa
            </p>
            <p className="text-xs mt-4 max-w-xs mx-auto">
              Em produção: Mapa interativo com Leaflet/Mapbox mostrando pins
              de cada imóvel com clustering e filtros visuais
            </p>
          </div>
        </div>

        {/* Mock pins scattered */}
        {properties.slice(0, 10).map((property, idx) => (
          <button
            key={property.id}
            onClick={() => onPropertySelect?.(property)}
            className="absolute w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold hover:scale-125 transition-transform"
            style={{
              left: `${15 + (idx * 7)}%`,
              top: `${20 + (idx * 6)}%`,
            }}
          >
            {property.angaria_score.toFixed(0)}
          </button>
        ))}
      </div>
    </div>
  );
}
