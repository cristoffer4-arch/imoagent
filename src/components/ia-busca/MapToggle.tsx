"use client";

import { LayoutGrid, Map as MapIcon } from "lucide-react";

/**
 * Tipo de visualização: grade ou mapa
 */
export type ViewType = "grid" | "map";

/**
 * Props para o componente MapToggle
 */
interface MapToggleProps {
  /** Visualização atual */
  view: ViewType;
  /** Callback para mudança de visualização */
  onChange: (view: ViewType) => void;
}

/**
 * MapToggle - Alternador entre visualização em grade e mapa
 * 
 * Componente que permite ao usuário alternar entre:
 * - Visualização em grade (grid) - cards organizados
 * - Visualização em mapa (map) - mapa interativo com marcadores
 * 
 * Utiliza cores emerald para estado ativo e slate para inativo,
 * seguindo o design system do projeto.
 */
export function MapToggle({ view, onChange }: MapToggleProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
      {/* Botão Grade */}
      <button
        onClick={() => onChange("grid")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
          transition-all duration-200
          ${
            view === "grid"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }
        `}
        aria-label="Visualização em grade"
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Grade</span>
      </button>

      {/* Botão Mapa */}
      <button
        onClick={() => onChange("map")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
          transition-all duration-200
          ${
            view === "map"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }
        `}
        aria-label="Visualização em mapa"
        aria-pressed={view === "map"}
      >
        <MapIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Mapa</span>
      </button>
    </div>
  );
}
