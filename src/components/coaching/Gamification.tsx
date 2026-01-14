"use client";

import { useState, useEffect } from 'react';
import { getUserStats } from '@/lib/supabase-coaching';

const ACHIEVEMENTS = [
  { id: 'first_lead', name: 'Primeiro Lead', icon: '🎯', description: 'Gerou seu primeiro lead', points: 10 },
  { id: 'first_visit', name: 'Primeira Visita', icon: '🏠', description: 'Completou primeira visita', points: 20 },
  { id: 'first_listing', name: 'Primeira Angariação', icon: '📋', description: 'Angariou primeira propriedade', points: 50 },
  { id: 'first_sale', name: 'Primeira Venda', icon: '💰', description: 'Fechou primeira venda', points: 100 },
  { id: 'streak_7', name: 'Semana Perfeita', icon: '🔥', description: '7 dias consecutivos', points: 50 },
  { id: 'streak_30', name: 'Mês Dedicado', icon: '⭐', description: '30 dias consecutivos', points: 200 },
  { id: 'leads_50', name: 'Caçador', icon: '🎯', description: '50 leads gerados', points: 100 },
  { id: 'leads_100', name: 'Mestre Caçador', icon: '🏹', description: '100 leads gerados', points: 250 },
  { id: 'sales_10', name: 'Fechador', icon: '💵', description: '10 vendas realizadas', points: 300 },
  { id: 'sales_25', name: 'Mestre Fechador', icon: '👑', description: '25 vendas realizadas', points: 750 },
  { id: 'commission_10k', name: 'Primeiro Marco', icon: '💎', description: '€10k em comissões', points: 500 },
  { id: 'commission_50k', name: 'Grande Liga', icon: '🏆', description: '€50k em comissões', points: 1000 },
];

const CHALLENGES = [
  { id: 1, title: '10 Ligações Diárias', progress: 45, target: 70, reward: 50, icon: '📞' },
  { id: 2, title: '5 Visitas Esta Semana', progress: 3, target: 5, reward: 30, icon: '🏠' },
  { id: 3, title: '2 Angariações', progress: 1, target: 2, reward: 100, icon: '📋' },
  { id: 4, title: 'Atualizar 20 Anúncios', progress: 12, target: 20, reward: 40, icon: '📝' },
];

const TEAM_RANKING = [
  { rank: 1, name: 'João Silva', points: 2450, avatar: '👨' },
  { rank: 2, name: 'Maria Costa', points: 2100, avatar: '👩' },
  { rank: 3, name: 'Você', points: 1850, avatar: '🎯', isUser: true },
  { rank: 4, name: 'Pedro Santos', points: 1600, avatar: '👨' },
  { rank: 5, name: 'Ana Ferreira', points: 1400, avatar: '👩' },
];

export function Gamification({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await getUserStats(userId);
      // If no stats exist, create default
      if (!data) {
        setStats({
          total_points: 1850,
          level: 8,
          current_streak: 5,
          longest_streak: 12,
          achievements: ACHIEVEMENTS.slice(0, 6).map((a, i) => ({
            ...a,
            earned_at: new Date(Date.now() - i * 86400000).toISOString(),
          })),
        });
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const level = stats?.level || 8;
  const points = stats?.total_points || 1850;
  const nextLevelPoints = level * 250;
  const progressToNext = ((points % nextLevelPoints) / nextLevelPoints) * 100;

  return (
    <div className="space-y-6">
      {/* Level & Points */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-purple-300 mb-1">Nível Atual</div>
            <div className="text-6xl font-bold text-white">{level}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-300 mb-1">Total de Pontos</div>
            <div className="text-4xl font-bold text-purple-300">{points.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-300">
            <span>Progresso para Nível {level + 1}</span>
            <span>{Math.round(progressToNext)}%</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔥</span>
            <div>
              <div className="text-sm text-orange-300">Streak Atual</div>
              <div className="text-3xl font-bold text-white">
                {stats?.current_streak || 5} dias
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Continue fazendo login diariamente!</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⭐</span>
            <div>
              <div className="text-sm text-yellow-300">Melhor Streak</div>
              <div className="text-3xl font-bold text-white">
                {stats?.longest_streak || 12} dias
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Seu recorde pessoal</p>
        </div>
      </div>

      {/* Weekly Challenges */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          🎯 Desafios Semanais
        </h4>
        <div className="space-y-4">
          {CHALLENGES.map((challenge) => (
            <div key={challenge.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{challenge.icon}</span>
                  <span className="text-sm font-medium text-slate-200">
                    {challenge.title}
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">
                  +{challenge.reward} pts
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {challenge.progress}/{challenge.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          🏆 Conquistas
          <span className="text-sm text-slate-400">
            ({stats?.achievements?.length || 6}/{ACHIEVEMENTS.length})
          </span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const earned = stats?.achievements?.some(
              (a: any) => a.badge_type === achievement.id
            );
            return (
              <div
                key={achievement.id}
                className={`rounded-xl p-4 border-2 transition ${
                  earned
                    ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/50'
                    : 'bg-slate-900/50 border-slate-700 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2 text-center">{achievement.icon}</div>
                <div className="text-xs font-semibold text-slate-200 text-center mb-1">
                  {achievement.name}
                </div>
                <div className="text-xs text-slate-400 text-center mb-2">
                  {achievement.description}
                </div>
                <div className="text-xs font-bold text-amber-400 text-center">
                  {earned ? `+${achievement.points} pts` : '🔒'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Ranking */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          👥 Ranking da Equipe
        </h4>
        <div className="space-y-2">
          {TEAM_RANKING.map((member) => (
            <div
              key={member.rank}
              className={`flex items-center gap-4 p-3 rounded-lg transition ${
                member.isUser
                  ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                  : 'bg-slate-900/50 border border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 font-bold text-slate-300">
                {member.rank}
              </div>
              <span className="text-2xl">{member.avatar}</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-100">{member.name}</div>
                <div className="text-xs text-slate-400">{member.points} pontos</div>
              </div>
              {member.rank <= 3 && (
                <span className="text-2xl">
                  {member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : '🥉'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
