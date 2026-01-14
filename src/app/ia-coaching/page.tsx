"use client";

import { useState } from 'react';
import Link from "next/link";
import { SmartGoals } from '@/components/coaching/SmartGoals';
import { KPIDashboard } from '@/components/coaching/KPIDashboard';
import { CoachingChat } from '@/components/coaching/CoachingChat';
import { ActionPlan } from '@/components/coaching/ActionPlan';
import { DISCAnalysis } from '@/components/coaching/DISCAnalysis';
import { Gamification } from '@/components/coaching/Gamification';

type Tab = 'dashboard' | 'goals' | 'coaching' | 'actions' | 'disc' | 'gamification';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'goals', label: 'Metas SMART', icon: '🎯' },
  { id: 'coaching', label: 'Coaching IA', icon: '💬' },
  { id: 'actions', label: 'Plano de Ação', icon: '📝' },
  { id: 'disc', label: 'DISC & PNL', icon: '🧠' },
  { id: 'gamification', label: 'Conquistas', icon: '🏆' },
] as const;

export default function IACoachingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Mock user ID - in production, get from auth
  const userId = 'demo-user-123';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-2">
                ← Voltar
              </Link>
              <h1 className="text-3xl font-bold">IA Coaching SMART</h1>
              <div className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40 mt-2">
                Gemini Planner
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="animate-fadeIn">
          {activeTab === 'dashboard' && <KPIDashboard userId={userId} />}
          {activeTab === 'goals' && <SmartGoals userId={userId} />}
          {activeTab === 'coaching' && <CoachingChat userId={userId} />}
          {activeTab === 'actions' && <ActionPlan userId={userId} />}
          {activeTab === 'disc' && <DISCAnalysis userId={userId} />}
          {activeTab === 'gamification' && <Gamification userId={userId} />}
        </div>
      </div>

      {/* Footer Quick Stats */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 py-3 hidden md:block">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-400">Nível:</span>
                <span className="ml-2 font-semibold text-emerald-400">8</span>
              </div>
              <div>
                <span className="text-slate-400">Pontos:</span>
                <span className="ml-2 font-semibold text-purple-400">1,850</span>
              </div>
              <div>
                <span className="text-slate-400">Streak:</span>
                <span className="ml-2 font-semibold text-orange-400">5 dias 🔥</span>
              </div>
            </div>
            <div className="text-slate-500">
              Sistema de Coaching com IA • Powered by Gemini
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}