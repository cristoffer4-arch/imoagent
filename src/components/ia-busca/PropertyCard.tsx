"use client";

import { MapPin, Home, Maximize2, BedDouble, Bath } from "lucide-react";
import { PropertyCanonicalModel, PropertyType } from "@/models/PropertyCanonicalModel";
import Image from "next/image";

/**
 * Props para o componente PropertyCard
 */
interface PropertyCardProps {
  /** Propriedade a ser exibida */
  property: PropertyCanonicalModel;
  /** Score de relevância (0-100) */
  score: number;
  /** Razões para o match/score */
  matchReasons: string[];
  /** Portais onde foi encontrado */
  portals: string[];
  /** Callback ao clicar no card */
  onClick?: () => void;
}

/**
 * PropertyCard - Card de exibição de propriedade
 * 
 * Exibe informações de uma propriedade com:
 * - Imagem (ou placeholder)
 * - Título e localização
 * - Preço e características
 * - Score com cor codificada
 * - Badges de portais
 * - Razões de match
 */
export function PropertyCard({
  property,
  score,
  matchReasons,
  portals,
  onClick,
}: PropertyCardProps) {
  const imageUrl = property.images?.[0]?.url;
  const hasImage = !!imageUrl;

  // Determina a cor do score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500 text-white";
    if (score >= 60) return "bg-yellow-500 text-black";
    return "bg-red-500 text-white";
  };

  // Formata preço em EUR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Traduz tipo de imóvel
  const getPropertyTypeLabel = (type: PropertyType) => {
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
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-900 rounded-xl border border-slate-800 overflow-hidden
        transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {/* Imagem ou Placeholder */}
      <div className="relative aspect-video bg-slate-950">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={property.title || "Imóvel"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-16 h-16 text-slate-700" />
          </div>
        )}

        {/* Score Badge */}
        <div className="absolute top-3 right-3">
          <div
            className={`
              px-3 py-1.5 rounded-full text-sm font-bold shadow-lg
              ${getScoreColor(score)}
            `}
          >
            {score}
          </div>
        </div>

        {/* Portal Badges */}
        {portals.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {portals.slice(0, 3).map((portal) => (
              <span
                key={portal}
                className="px-2 py-1 bg-black/70 backdrop-blur-sm text-xs text-slate-200 rounded-md"
              >
                {portal}
              </span>
            ))}
            {portals.length > 3 && (
              <span className="px-2 py-1 bg-black/70 backdrop-blur-sm text-xs text-slate-200 rounded-md">
                +{portals.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        {/* Tipo e Título */}
        <div>
          <div className="text-xs text-emerald-400 font-medium mb-1">
            {getPropertyTypeLabel(property.type)}
            {property.characteristics.typology && ` • ${property.characteristics.typology}`}
          </div>
          <h3 className="text-slate-50 font-semibold line-clamp-1">
            {property.title || "Sem título"}
          </h3>
        </div>

        {/* Localização */}
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">
            {property.location.address.freguesia && `${property.location.address.freguesia}, `}
            {property.location.address.concelho}
          </span>
        </div>

        {/* Preço */}
        <div className="text-2xl font-bold text-slate-50">
          {formatPrice(property.price.value)}
        </div>

        {/* Características */}
        <div className="flex items-center gap-4 text-sm text-slate-400">
          {property.characteristics.totalArea && (
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4" />
              <span>{property.characteristics.totalArea} m²</span>
            </div>
          )}
          {property.characteristics.bedrooms !== undefined && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4" />
              <span>{property.characteristics.bedrooms}</span>
            </div>
          )}
          {property.characteristics.bathrooms !== undefined && (
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4" />
              <span>{property.characteristics.bathrooms}</span>
            </div>
          )}
        </div>

        {/* Razões de Match */}
        {matchReasons.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 space-y-1">
              {matchReasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="line-clamp-1">
                  • {reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
