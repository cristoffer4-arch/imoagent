"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Target,
  Trophy,
  Megaphone,
  Scale,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const items = [
  { href: "/ia-busca", label: "IA Busca", icon: Search },
  { href: "/ia-coaching", label: "IA Coaching", icon: Target },
  { href: "/ia-gamificacao", label: "IA Gamificação", icon: Trophy },
  { href: "/ia-anuncios-idealista", label: "IA Anúncios", icon: Megaphone },
  { href: "/ia-assistente-legal", label: "IA Legal", icon: Scale },
  { href: "/ia-leads-comissoes", label: "IA Leads", icon: TrendingUp },
  { href: "/ia-orquestradora", label: "IA Orquestra", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 rounded-2xl border border-pink-100 bg-white/80 p-4 shadow-sm lg:block">
      <p className="mb-3 text-xs font-semibold uppercase text-pink-500">IAs</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-gradient-to-r from-pink-50 to-purple-50 text-[#E91E63]"
                  : "text-gray-700 hover:bg-pink-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
