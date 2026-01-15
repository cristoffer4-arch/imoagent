"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Euro, Home, X } from "lucide-react";
import { SearchFilters as SearchFiltersType } from "@/types/search";

/**
 * Props para o componente SearchFilters
 */
interface SearchFiltersProps {
  /** Filtros atuais */
  filters: SearchFiltersType;
  /** Callback quando os filtros são alterados */
  onChange: (filters: SearchFiltersType) => void;
}

/**
 * SearchFilters - Filtros avançados de busca
 * 
 * Permite configurar múltiplos filtros para refinar a busca de imóveis:
 * - Localização (distrito, concelho, freguesia)
 * - Preço (min/max)
 * - Área (min/max)
 * - Tipo de imóvel
 * - Tipologia (T0, T1, T2, etc.)
 * - Características (elevador, varanda, garagem, etc.)
 */
export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["location", "price", "area"])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateFilters = (updates: Partial<SearchFiltersType>) => {
    onChange({ ...filters, ...updates });
  };

  const toggleArrayValue = (array: string[] | undefined, value: string) => {
    const current = array || [];
    if (current.includes(value)) {
      return current.filter((v) => v !== value);
    }
    return [...current, value];
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-50">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Localização */}
      <FilterSection
        title="Localização"
        icon={<MapPin className="w-4 h-4" />}
        expanded={expandedSections.has("location")}
        onToggle={() => toggleSection("location")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filters.distrito || ""}
            onChange={(e) => updateFilters({ distrito: e.target.value || undefined })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Distrito</option>
            <option value="Lisboa">Lisboa</option>
            <option value="Porto">Porto</option>
            <option value="Faro">Faro</option>
            <option value="Braga">Braga</option>
            <option value="Coimbra">Coimbra</option>
            <option value="Aveiro">Aveiro</option>
            <option value="Setúbal">Setúbal</option>
          </select>

          <select
            value={filters.concelho || ""}
            onChange={(e) => updateFilters({ concelho: e.target.value || undefined })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Concelho</option>
            <option value="Lisboa">Lisboa</option>
            <option value="Cascais">Cascais</option>
            <option value="Sintra">Sintra</option>
            <option value="Oeiras">Oeiras</option>
            <option value="Porto">Porto</option>
            <option value="Vila Nova de Gaia">Vila Nova de Gaia</option>
          </select>

          <input
            type="text"
            placeholder="Freguesia"
            value={filters.freguesia || ""}
            onChange={(e) => updateFilters({ freguesia: e.target.value || undefined })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </FilterSection>

      {/* Preço */}
      <FilterSection
        title="Preço"
        icon={<Euro className="w-4 h-4" />}
        expanded={expandedSections.has("price")}
        onToggle={() => toggleSection("price")}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ""}
              onChange={(e) => updateFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 pr-12 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              EUR
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ""}
              onChange={(e) => updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 pr-12 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              EUR
            </span>
          </div>
        </div>
      </FilterSection>

      {/* Área */}
      <FilterSection
        title="Área"
        icon={<Home className="w-4 h-4" />}
        expanded={expandedSections.has("area")}
        onToggle={() => toggleSection("area")}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="number"
              placeholder="Min"
              value={filters.minArea || ""}
              onChange={(e) => updateFilters({ minArea: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              m²
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="Max"
              value={filters.maxArea || ""}
              onChange={(e) => updateFilters({ maxArea: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              m²
            </span>
          </div>
        </div>
      </FilterSection>

      {/* Tipo de Imóvel */}
      <FilterSection
        title="Tipo de Imóvel"
        icon={<Home className="w-4 h-4" />}
        expanded={expandedSections.has("type")}
        onToggle={() => toggleSection("type")}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL", "OFFICE"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.propertyType?.includes(type) || false}
                onChange={() =>
                  updateFilters({
                    propertyType: toggleArrayValue(filters.propertyType, type),
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-300 capitalize">
                {type === "APARTMENT" && "Apartamento"}
                {type === "HOUSE" && "Moradia"}
                {type === "VILLA" && "Vivenda"}
                {type === "LAND" && "Terreno"}
                {type === "COMMERCIAL" && "Comercial"}
                {type === "OFFICE" && "Escritório"}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Tipologia */}
      <FilterSection
        title="Tipologia"
        icon={<Home className="w-4 h-4" />}
        expanded={expandedSections.has("typology")}
        onToggle={() => toggleSection("typology")}
      >
        <div className="flex flex-wrap gap-2">
          {["T0", "T1", "T2", "T3", "T4", "T5+"].map((typology) => (
            <label
              key={typology}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.typology?.includes(typology) || false}
                onChange={() =>
                  updateFilters({
                    typology: toggleArrayValue(filters.typology, typology),
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="text-sm font-medium text-slate-300">{typology}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Características */}
      <FilterSection
        title="Características"
        icon={<Home className="w-4 h-4" />}
        expanded={expandedSections.has("features")}
        onToggle={() => toggleSection("features")}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { value: "elevator", label: "Elevador" },
            { value: "balcony", label: "Varanda" },
            { value: "garage", label: "Garagem" },
            { value: "pool", label: "Piscina" },
            { value: "garden", label: "Jardim" },
            { value: "terrace", label: "Terraço" },
            { value: "airConditioning", label: "Ar Condicionado" },
            { value: "heating", label: "Aquecimento" },
            { value: "fireplace", label: "Lareira" },
          ].map((feature) => (
            <label
              key={feature.value}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.features?.includes(feature.value) || false}
                onChange={() =>
                  updateFilters({
                    features: toggleArrayValue(filters.features, feature.value),
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-300">{feature.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

/**
 * FilterSection - Seção expansível de filtros
 */
interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, icon, expanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="border-t border-slate-800 pt-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">
            {icon}
          </span>
          <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
            {title}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
        )}
      </button>
      {expanded && <div className="mt-4">{children}</div>}
    </div>
  );
}
