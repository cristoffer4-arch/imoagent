"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { SearchResultItem } from "@/types/search";
import { PropertyType } from "@/models/PropertyCanonicalModel";
import { MapPin, Maximize2, BedDouble, Bath } from "lucide-react";

// Fix for default marker icons in Leaflet
import "leaflet/dist/leaflet.css";

/**
 * Props para o componente PropertyMap
 */
interface PropertyMapProps {
  /** Lista de propriedades a serem exibidas no mapa */
  properties: SearchResultItem[];
  /** Centro do mapa (opcional, calcula automaticamente se não fornecido) */
  center?: { lat: number; lng: number };
  /** Callback ao clicar em uma propriedade */
  onPropertyClick?: (propertyId: string) => void;
}

/**
 * Componente auxiliar para ajustar bounds do mapa
 */
function MapBoundsUpdater({ properties }: { properties: SearchResultItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) return;

    // Filtra propriedades com coordenadas válidas
    const validProperties = properties.filter(
      (item) => item.property.location.coordinates
    );

    if (validProperties.length === 0) return;

    // Cria bounds baseado em todas as propriedades
    const bounds = L.latLngBounds(
      validProperties.map((item) => [
        item.property.location.coordinates!.latitude,
        item.property.location.coordinates!.longitude,
      ])
    );

    // Ajusta o mapa para mostrar todos os marcadores
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [properties, map]);

  return null;
}

/**
 * Cria ícone customizado para marcador baseado no score
 */
function createCustomIcon(score: number): L.DivIcon {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#eab308" : "#ef4444";
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">${score}</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

/**
 * Formata preço em EUR
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Traduz tipo de imóvel
 */
function getPropertyTypeLabel(type: PropertyType): string {
  const labels: Record<PropertyType, string> = {
    [PropertyType.APARTMENT]: "Apartamento",
    [PropertyType.HOUSE]: "Moradia",
    [PropertyType.VILLA]: "Vivenda",
    [PropertyType.LAND]: "Terreno",
    [PropertyType.COMMERCIAL]: "Comercial",
    [PropertyType.OFFICE]: "Escritório",
    [PropertyType.WAREHOUSE]: "Armazém",
    [PropertyType.GARAGE]: "Garagem",
    [PropertyType.OTHER]: "Outro",
  };
  return labels[type] || type;
}

/**
 * PropertyMap - Mapa interativo de propriedades
 * 
 * Exibe propriedades em um mapa usando Leaflet com:
 * - Marcadores clusterizados
 * - Cores baseadas em score (verde >80, amarelo 60-80, vermelho <60)
 * - Popup com informações resumidas
 * - Auto-zoom para ajustar todos os marcadores
 * - Tema escuro
 */
export function PropertyMap({
  properties,
  center,
  onPropertyClick,
}: PropertyMapProps) {
  // Filtra propriedades com coordenadas válidas
  const validProperties = useMemo(
    () => properties.filter((item) => item.property.location.coordinates),
    [properties]
  );

  // Calcula centro do mapa
  const mapCenter = useMemo(() => {
    if (center) return [center.lat, center.lng] as [number, number];
    
    if (validProperties.length === 0) {
      // Centro de Portugal (Lisboa)
      return [38.7223, -9.1393] as [number, number];
    }

    // Calcula média das coordenadas
    const avgLat =
      validProperties.reduce(
        (sum, item) => sum + item.property.location.coordinates!.latitude,
        0
      ) / validProperties.length;
    const avgLng =
      validProperties.reduce(
        (sum, item) => sum + item.property.location.coordinates!.longitude,
        0
      ) / validProperties.length;

    return [avgLat, avgLng] as [number, number];
  }, [center, validProperties]);

  // Estado vazio
  if (validProperties.length === 0) {
    return (
      <div className="w-full h-[500px] md:h-[600px] bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">
            Sem coordenadas geográficas
          </h3>
          <p className="text-slate-400">
            Nenhuma propriedade com localização disponível para exibir no mapa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Tile Layer - OpenStreetMap com estilo escuro */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Atualiza bounds automaticamente */}
        <MapBoundsUpdater properties={validProperties} />

        {/* Cluster de Marcadores */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();
            const avgScore = Math.round(
              cluster.getAllChildMarkers().reduce((sum: number, marker: any) => {
                return sum + (marker.options.score || 0);
              }, 0) / count
            );
            
            const color = avgScore >= 80 ? "#10b981" : avgScore >= 60 ? "#eab308" : "#ef4444";
            
            return L.divIcon({
              html: `
                <div style="
                  background-color: ${color};
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 14px;
                ">
                  ${count}
                </div>
              `,
              className: "custom-cluster-icon",
              iconSize: L.point(40, 40, true),
            });
          }}
        >
          {validProperties.map((item) => {
            const { property, score, portalsFound } = item;
            const coords = property.location.coordinates!;

            return (
              <Marker
                key={property.id}
                position={[coords.latitude, coords.longitude]}
                icon={createCustomIcon(score)}
                eventHandlers={{
                  click: () => {
                    if (onPropertyClick) {
                      onPropertyClick(property.id);
                    }
                  },
                }}
                // @ts-ignore - custom property for cluster icon
                score={score}
              >
                <Popup
                  className="custom-popup"
                  maxWidth={300}
                  minWidth={250}
                >
                  <div className="bg-slate-900 text-slate-50 p-3 rounded-lg -m-3">
                    {/* Cabeçalho */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-emerald-400 font-medium mb-1">
                          {getPropertyTypeLabel(property.type)}
                          {property.characteristics.typology &&
                            ` • ${property.characteristics.typology}`}
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2 pr-2">
                          {property.title || "Sem título"}
                        </h3>
                      </div>
                      <div
                        className={`
                          px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0
                          ${score >= 80 ? "bg-emerald-500 text-white" : ""}
                          ${score >= 60 && score < 80 ? "bg-yellow-500 text-black" : ""}
                          ${score < 60 ? "bg-red-500 text-white" : ""}
                        `}
                      >
                        {score}
                      </div>
                    </div>

                    {/* Localização */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {property.location.address.freguesia &&
                          `${property.location.address.freguesia}, `}
                        {property.location.address.concelho}
                      </span>
                    </div>

                    {/* Preço */}
                    <div className="text-xl font-bold text-emerald-400 mb-3">
                      {formatPrice(property.price.value)}
                    </div>

                    {/* Características */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      {property.characteristics.totalArea && (
                        <div className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{property.characteristics.totalArea} m²</span>
                        </div>
                      )}
                      {property.characteristics.bedrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5" />
                          <span>{property.characteristics.bedrooms}</span>
                        </div>
                      )}
                      {property.characteristics.bathrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5" />
                          <span>{property.characteristics.bathrooms}</span>
                        </div>
                      )}
                    </div>

                    {/* Portais */}
                    {portalsFound.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
                        {portalsFound.slice(0, 3).map((portal) => (
                          <span
                            key={portal}
                            className="px-2 py-0.5 bg-slate-800 text-xs text-slate-300 rounded"
                          >
                            {portal}
                          </span>
                        ))}
                        {portalsFound.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-800 text-xs text-slate-300 rounded">
                            +{portalsFound.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Custom styles for dark theme */}
      <style jsx global>{`
        .leaflet-container {
          background: #0f172a;
          font-family: inherit;
        }
        
        .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
          border-radius: 0.5rem;
        }
        
        .leaflet-popup-content {
          margin: 0;
          min-width: 250px;
        }
        
        .leaflet-popup-tip-container {
          display: none;
        }
        
        .leaflet-control-zoom a {
          background-color: #1e293b;
          color: #e2e8f0;
          border-color: #334155;
        }
        
        .leaflet-control-zoom a:hover {
          background-color: #334155;
          color: #f1f5f9;
        }
        
        .leaflet-bar {
          border: 1px solid #334155;
        }
        
        .leaflet-control-attribution {
          background-color: rgba(15, 23, 42, 0.8);
          color: #94a3b8;
          font-size: 10px;
        }
        
        .leaflet-control-attribution a {
          color: #10b981;
        }
        
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .custom-cluster-icon {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
