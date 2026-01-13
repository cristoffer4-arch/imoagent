'use client'

import { Trophy, Star, Award, Gift, Zap, Medal, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MOCK_RANKING = [
  { id: 1, name: 'Ana Silva', points: 8500, level: 12, avatar: '👩‍💼', sales: 45, leads: 120 },
  { id: 2, name: 'João Costa', points: 7200, level: 11, avatar: '👨‍💼', sales: 38, leads: 105 },
  { id: 3, name: 'Maria Santos', points: 6800, level: 10, avatar: '👩‍🦰', sales: 35, leads: 98 },
  { id: 4, name: 'Pedro Oliveira', points: 5900, level: 9, avatar: '👨‍🦱', sales: 30, leads: 85 },
  { id: 5, name: 'Carla Ferreira', points: 5400, level: 9, avatar: '👩‍🦳', sales: 28, leads: 80 },
  { id: 6, name: 'Você', points: 4800, level: 8, avatar: '🧑‍💼', sales: 24, leads: 70, isCurrentUser: true },
  { id: 7, name: 'Bruno Alves', points: 4200, level: 8, avatar: '👨‍💻', sales: 22, leads: 65 },
  { id: 8, name: 'Sofia Martins', points: 3800, level: 7, avatar: '👩', sales: 20, leads: 60 },
  { id: 9, name: 'Rui Pereira', points: 3400, level: 7, avatar: '👨', sales: 18, leads: 55 },
  { id: 10, name: 'Ines Rodrigues', points: 3000, level: 6, avatar: '👩‍🎓', sales: 16, leads: 50 },
]

const CHALLENGES = [
  {
    id: 1,
    title: 'Vendedor Relâmpago',
    description: 'Feche 5 vendas em 7 dias',
    reward: 500,
    progress: 3,
    total: 5,
    deadline: '20 Jan 2026',
    icon: '⚡',
    difficulty: 'Médio',
  },
  {
    id: 2,
    title: 'Mestre dos Leads',
    description: 'Capture 50 leads qualificados',
    reward: 300,
    progress: 35,
    total: 50,
    deadline: '31 Jan 2026',
    icon: '🎯',
    difficulty: 'Fácil',
  },
  {
    id: 3,
    title: 'Rei da Conversão',
    description: 'Converta 80% dos leads contactados',
    reward: 1000,
    progress: 12,
    total: 20,
    deadline: '15 Fev 2026',
    icon: '👑',
    difficulty: 'Difícil',
  },
]

const BADGES = [
  { id: 1, name: 'Primeira Venda', icon: '🌟', earned: true },
  { id: 2, name: '10 Vendas', icon: '💫', earned: true },
  { id: 3, name: '25 Vendas', icon: '✨', earned: true },
  { id: 4, name: 'Vendedor do Mês', icon: '🏆', earned: false },
  { id: 5, name: 'Streak 7 dias', icon: '🔥', earned: true },
  { id: 6, name: '100 Leads', icon: '🎯', earned: true },
  { id: 7, name: 'Mentor', icon: '🎓', earned: false },
  { id: 8, name: 'Campeão', icon: '👑', earned: false },
]

const REWARDS = [
  { id: 1, name: 'Vale €50 Amazon', cost: 5000, icon: '🎁', available: false },
  { id: 2, name: 'Dia de Folga Extra', cost: 3000, icon: '🏖️', available: true },
  { id: 3, name: 'Almoço Premium', cost: 1500, icon: '🍽️', available: true },
  { id: 4, name: 'Upgrade Escritório', cost: 10000, icon: '💼', available: false },
]

export default function IAGamificacaoPage() {
  const currentUser = MOCK_RANKING.find(u => u.isCurrentUser)!
  const xpToNextLevel = 5200
  const xpProgress = (currentUser.points % 1000) / 1000 * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-yellow-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-yellow-100/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Gamificação</h1>
          <p className="text-gray-700">Gestão de rankings, desafios e recompensas para motivar a equipa de vendas.</p>
        </div>

        {/* User Profile Card */}
        <div className="rounded-3xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{currentUser.avatar}</div>
              <div>
                <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                <p className="text-yellow-100">Consultor Imobiliário</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-1">Nível {currentUser.level}</div>
              <div className="flex items-center gap-2 text-yellow-100">
                <Star className="w-5 h-5" />
                {currentUser.points} XP
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-yellow-100">
              <span>Progresso para Nível {currentUser.level + 1}</span>
              <span>{currentUser.points} / {xpToNextLevel} XP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-4">
              <div
                className="bg-white h-4 rounded-full transition-all shadow-lg"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{currentUser.sales}</div>
              <div className="text-sm text-yellow-100 mt-1">Vendas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{currentUser.leads}</div>
              <div className="text-sm text-yellow-100 mt-1">Leads</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{BADGES.filter(b => b.earned).length}</div>
              <div className="text-sm text-yellow-100 mt-1">Badges</div>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-yellow-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Ranking de Consultores
          </h2>
          <div className="space-y-3">
            {MOCK_RANKING.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02] ${
                  user.isCurrentUser
                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 ring-2 ring-yellow-500'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100'
                }`}
              >
                {/* Position */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                  {index === 0 && <Crown className="w-6 h-6 text-yellow-600" />}
                  {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                  {index === 2 && <Medal className="w-6 h-6 text-orange-600" />}
                  {index > 2 && <span className="font-bold text-gray-600">#{index + 1}</span>}
                </div>

                {/* Avatar */}
                <div className="text-4xl">{user.avatar}</div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Nível {user.level}</span>
                    <span>•</span>
                    <span>{user.sales} vendas</span>
                    <span>•</span>
                    <span>{user.leads} leads</span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{user.points}</div>
                  <div className="text-sm text-gray-600">XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenges */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-yellow-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-600" />
            Desafios Ativos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHALLENGES.map((challenge) => (
              <div
                key={challenge.id}
                className="rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-50 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{challenge.icon}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    challenge.difficulty === 'Fácil' ? 'bg-green-100 text-green-700' :
                    challenge.difficulty === 'Médio' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{challenge.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>

                {/* Progress */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-semibold text-gray-900">{challenge.progress}/{challenge.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Prazo: {challenge.deadline}</span>
                  <span className="font-bold text-yellow-600 flex items-center gap-1">
                    <Gift className="w-4 h-4" />
                    +{challenge.reward} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-yellow-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            Conquistas & Badges
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {BADGES.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-2xl p-4 text-center transition-all hover:scale-110 ${
                  badge.earned
                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100 shadow-md'
                    : 'bg-gray-100 opacity-40'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-xs font-medium text-gray-700">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-yellow-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-600" />
            Recompensas Disponíveis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REWARDS.map((reward) => (
              <div
                key={reward.id}
                className={`rounded-3xl p-6 text-center ${
                  reward.available
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'bg-gray-100 opacity-60'
                }`}
              >
                <div className="text-5xl mb-4">{reward.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{reward.name}</h3>
                <div className="text-2xl font-bold text-yellow-600 mb-4">{reward.cost} XP</div>
                <Button
                  disabled={!reward.available}
                  variant={reward.available ? 'primary' : 'ghost'}
                  className="w-full"
                  size="sm"
                >
                  {reward.available ? 'Resgatar' : 'Bloqueado'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              icon="🏙️"
              title="Lead City"
              description="Multiplayer plataforma 2D"
              onClick={() => router.push('/aplicativo/games/leadcity')}
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
