import { Property } from '@/types/busca-ia';
import { PropertyCard } from './PropertyCard';
import { Package } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  mode: 'angariacao' | 'venda';
  onPropertyClick: (property: Property) => void;
}

export function PropertyList({
  properties,
  mode,
  onPropertyClick,
}: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package size={48} className="text-slate-600 mb-4" />
        <h3 className="text-xl font-bold mb-2">Nenhum imóvel encontrado</h3>
        <p className="text-slate-400">
          Tente ajustar os filtros de busca para ver mais resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {properties.length} {properties.length === 1 ? 'Imóvel' : 'Imóveis'} Encontrados
        </h2>
        <div className="text-sm text-slate-400">
          Ordenado por score {mode === 'angariacao' ? 'angariação' : 'venda'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            mode={mode}
            onClick={() => onPropertyClick(property)}
          />
        ))}
      </div>
    </div>
  );
}
