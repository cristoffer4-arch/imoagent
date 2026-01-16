import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "ImoAgent - Plataforma Imobiliária com IA",
  description: "Plataforma completa de gestão imobiliária com 7 agentes de IA, busca em múltiplos portais, coaching SMART, gamificação e análise de dados.",
  keywords: "imóveis, inteligência artificial, gestão imobiliária, corretor, propriedades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
