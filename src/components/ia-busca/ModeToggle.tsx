"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { SearchMode } from "@/types/search";

/**
 * Props para o componente ModeToggle
 */
interface ModeToggleProps {
  /** Modo de busca atual */
  mode: SearchMode;
  /** Callback quando o modo é alterado */
  onChange: (mode: SearchMode) => void;
}

/**
 * ModeToggle - Toggle entre modos Angariação/Venda
 * 
 * Permite alternar entre os modos de busca:
 * - Angariação: Busca imóveis para angariar
 * - Venda: Busca imóveis para vender
 */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
      <button
        onClick={() => onChange(SearchMode.ANGARIACAO)}
        className={`
          flex items-center justify-center gap-2 px-6 py-3 rounded-xl
          font-medium transition-all duration-200
          ${
            mode === SearchMode.ANGARIACAO
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }
        `}
        aria-pressed={mode === SearchMode.ANGARIACAO}
      >
        <TrendingUp className="w-5 h-5" />
        <span>Angariação</span>
      </button>

      <button
        onClick={() => onChange(SearchMode.VENDA)}
        className={`
          flex items-center justify-center gap-2 px-6 py-3 rounded-xl
          font-medium transition-all duration-200
          ${
            mode === SearchMode.VENDA
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }
        `}
        aria-pressed={mode === SearchMode.VENDA}
      >
        <TrendingDown className="w-5 h-5" />
        <span>Venda</span>
      </button>
    </div>
  );
}
