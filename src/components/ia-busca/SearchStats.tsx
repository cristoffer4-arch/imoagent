"use client";

import {
  Home,
  Euro,
  TrendingUp,
  Maximize2,
  Star,
  Globe,
} from "lucide-react";
import { SearchStats as SearchStatsType } from "@/types/search";

/**
 * Props para o componente SearchStats
 */
interface SearchStatsProps {
  /** Estatísticas da busca */
  stats: SearchStatsType;
}

/**
 * SearchStats - Exibição de estatísticas de busca
 * 
 * Mostra estatísticas agregadas dos resultados:
 * - Total encontrado
 * - Preço médio
 * - Faixa de preço
 * - Área média
 * - Score médio
 * - Número de portais ativos
 */
export function SearchStats({ stats }: SearchStatsProps) {
  // Formata números em EUR
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Formata números com separadores
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-PT").format(value);
  };

  // Conta portais ativos
  const activePortals = Object.keys(stats.portalCounts || {}).length;

  const statItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Total",
      value: formatNumber(stats.totalFound),
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: <Euro className="w-5 h-5" />,
      label: "Preço Médio",
      value: formatEuro(stats.avgPrice),
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Faixa de Preço",
      value: `${formatEuro(stats.minPrice)} - ${formatEuro(stats.maxPrice)}`,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      wide: true,
    },
    {
      icon: <Maximize2 className="w-5 h-5" />,
      label: "Área Média",
      value: `${Math.round(stats.avgArea)} m²`,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: "Score Médio",
      value: Math.round(stats.avgScore).toString(),
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: "Portais",
      value: formatNumber(activePortals),
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className={`
            bg-slate-900 rounded-xl border border-slate-800 p-4
            transition-all duration-200 hover:shadow-lg hover:scale-105
            ${stat.wide ? "md:col-span-2 lg:col-span-2" : ""}
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <div className={stat.color}>{stat.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
              <div className="text-lg font-bold text-slate-50 truncate">
                {stat.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
