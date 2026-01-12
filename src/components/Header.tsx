"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User } from "lucide-react";
import { Button } from "./Button";

const links = [
  { href: "/", label: "Home" },
  { href: "/planos", label: "Planos" },
  { href: "/ia-orquestradora", label: "Orquestradora" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E63] to-[#9C27B0] text-white shadow-md">
            IA
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">Imoagent</p>
            <p className="text-xs text-gray-500">Plataforma Imobiliária IA</p>
          </div>
        </div>

        <nav className="hidden items-center gap-4 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-[#E91E63] font-semibold"
                  : "text-gray-700 hover:text-[#E91E63]"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden md:inline-flex">
            <Button variant="secondary">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button>Criar conta</Button>
          </Link>
          <div className="md:hidden">
            <Menu className="h-6 w-6 text-gray-700" />
          </div>
        </div>
      </div>
    </header>
  );
}
