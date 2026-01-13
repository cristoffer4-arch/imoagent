'use client';

import { useRouter } from 'next/navigation';
import { GameCard } from '@/components/games/GameCard';
import { getPlayerStats } from '@/lib/game-utils';
import { useState } from 'react';
import type { PlayerStats } from '@/types/games';

export default function IAGamificacaoPage() {
  const router = useRouter();
  const [stats] = useState<PlayerStats>(() => {
    // Initialize with player stats on client side
    if (typeof window !== 'undefined') {
      return getPlayerStats();
    }
    return {
      totalPoints: 0,
      gamesPlayed: 0,
      badges: [],
      streaks: {},
      highScores: {},
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm transition-all">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agente de Gamificação</h1>
          <p className="text-gray-700">Gestão de rankings, desafios e recompensas para motivar a equipa de vendas.</p>
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-1">Total de Pontos</div>
            <div className="text-4xl font-bold">{stats.totalPoints}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-1">Jogos Completos</div>
            <div className="text-4xl font-bold">{stats.gamesPlayed}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-1">Badges Conquistadas</div>
            <div className="text-4xl font-bold">{stats.badges.length}</div>
          </div>
        </div>

        {/* Mini-Games Section */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              🎮 Mini-Games Interativos
            </h2>
            <p className="text-gray-600">Jogos para desenvolver habilidades e ganhar pontos</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GameCard
              icon="🧩"
              title="Quebra-Cabeça"
              description="Monte imóveis de luxo"
              onClick={() => router.push('/aplicativo/games/puzzle')}
            />
            <GameCard
              icon="🎲"
              title="Imobiliária PT"
              description="Tabuleiro estratégico"
              onClick={() => router.push('/aplicativo/games/board')}
            />
            <GameCard
              icon="🎮"
              title="Caça Leads"
              description="Runner infinito"
              onClick={() => router.push('/aplicativo/games/runner')}
            />
            <GameCard
              icon="🧠"
              title="Quiz Diário"
              description="Teste seu conhecimento"
              onClick={() => router.push('/aplicativo/games/quiz')}
            />
          </div>
        </div>

        {/* Badges Section */}
        {stats.badges.length > 0 && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Suas Conquistas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.badges.map((badge) => (
                <div key={badge.id} className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 p-4 ring-1 ring-yellow-200">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-bold text-gray-900 mb-1">{badge.name}</div>
                  <div className="text-sm text-gray-600">{badge.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
