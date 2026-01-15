"use client";

/**
 * IA Busca Demo Page - Showcase notification system and dashboard UI
 */

import { useState } from 'react';
import Link from "next/link";
import { ArrowLeft, Bell, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadDashboard } from "@/components/ia-busca";

export default function IABuscaDemoPage() {
  const [showDashboard, setShowDashboard] = useState(false);
  const userId = 'demo-user-1';

  if (showDashboard) {
    return <LeadDashboard userId={userId} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50 p-8">
      <Link href="/ia-busca" className="inline-flex items-center gap-2 text-emerald-400 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>
      
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
        Demo: Sistema de Notificações
      </h1>
      
      <p className="text-slate-300 mb-8">
        Dashboard interativo com notificações em tempo real, filtros avançados e gestão de preferências.
      </p>

      <Button variant="primary" size="lg" onClick={() => setShowDashboard(true)}>
        <Home className="w-5 h-5 mr-2" />
        Abrir Dashboard
      </Button>
    </div>
  );
}
