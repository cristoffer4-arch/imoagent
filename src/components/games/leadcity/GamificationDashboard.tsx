'use client';

import { useEffect, useState } from 'react';
import {
  getPlayerStats,
  getGlobalRanking,
  getPlayerMatches,
  getAllAchievements,
  getPlayerByUserId,
  type LeadCityPlayer,
  type LeadCityMatch,
  type LeadCityAchievement,
  type LeadCityPlayerAchievement,
  type LeadCityRanking,
  type PlayerStats,
} from '@/lib/services/leadcity-service';

interface GamificationDashboardProps {
  userId: string;
}

export default function GamificationDashboard({ userId }: GamificationDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [globalRanking, setGlobalRanking] = useState<LeadCityRanking[]>([]);
  const [allAchievements, setAllAchievements] = useState<LeadCityAchievement[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get player by user ID
      const player = await getPlayerByUserId(userId);
      
      if (!player) {
        setError('Jogador não encontrado. Jogue uma partida primeiro!');
        setLoading(false);
        return;
      }

      // Load all data in parallel
      const [stats, ranking, achievements] = await Promise.all([
        getPlayerStats(player.id),
        getGlobalRanking(10),
        getAllAchievements(),
      ]);

      setPlayerStats(stats);
      setGlobalRanking(ranking);
      setAllAchievements(achievements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievementProgress = (achievement: LeadCityAchievement): number => {
    if (!playerStats?.player) return 0;

    const player = playerStats.player;
    let current = 0;

    switch (achievement.requirement_type) {
      case 'games_played':
        current = player.games_played;
        break;
      case 'games_won':
        current = player.games_won;
        break;
      case 'total_score':
        current = player.total_score;
        break;
      case 'highest_score':
        current = player.highest_score;
        break;
      case 'leads_captured':
        current = player.total_leads_captured;
        break;
      case 'properties_acquired':
        current = player.total_properties_acquired;
        break;
      case 'level':
        current = player.level;
        break;
      case 'time_played':
        current = player.total_time_played;
        break;
    }

    return Math.min(100, (current / achievement.requirement_value) * 100);
  };

  const isAchievementUnlocked = (achievementId: string): boolean => {
    return playerStats?.achievements.some(a => a.achievement_id === achievementId) || false;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="h-12 bg-gray-200 rounded-2xl animate-pulse w-96" />
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>

          {/* Sections Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!playerStats) {
    return null;
  }

  const { player, achievements, ranking, recentMatches } = playerStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">
            Dashboard de Gamificação
          </h1>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-gray-700 font-medium"
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Score */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="text-sm font-medium opacity-90 mb-1">Pontuação Total</div>
            <div className="text-4xl font-bold mb-2">{player.total_score.toLocaleString('pt-PT')}</div>
            <div className="text-xs opacity-75">🎯 Experiência acumulada</div>
          </div>

          {/* High Score */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="text-sm font-medium opacity-90 mb-1">Recorde</div>
            <div className="text-4xl font-bold mb-2">{player.highest_score.toLocaleString('pt-PT')}</div>
            <div className="text-xs opacity-75">🏆 Melhor partida</div>
          </div>

          {/* Games Played */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="text-sm font-medium opacity-90 mb-1">Partidas Jogadas</div>
            <div className="text-4xl font-bold mb-2">{player.games_played}</div>
            <div className="text-xs opacity-75">
              🎮 {player.games_won} vitórias ({player.games_played > 0 ? Math.round((player.games_won / player.games_played) * 100) : 0}%)
            </div>
          </div>

          {/* Rank Position */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="text-sm font-medium opacity-90 mb-1">Posição no Ranking</div>
            <div className="text-4xl font-bold mb-2">#{ranking?.rank || '-'}</div>
            <div className="text-xs opacity-75">📊 Nível {player.level}</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🏅 Conquistas</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {achievements.length}/{allAchievements.length}
              </span>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {allAchievements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma conquista disponível
                </div>
              ) : (
                allAchievements.map((achievement) => {
                  const unlocked = isAchievementUnlocked(achievement.id);
                  const progress = calculateAchievementProgress(achievement);

                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        unlocked
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-3xl ${unlocked ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-bold ${unlocked ? 'text-gray-900' : 'text-gray-600'}`}>
                              {achievement.name}
                            </h3>
                            {unlocked && <span className="text-xl">✅</span>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          
                          {/* Progress Bar */}
                          {!unlocked && (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.round(progress)}% completo
                              </div>
                            </>
                          )}
                          
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              +{achievement.points} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Global Ranking Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🌍 Ranking Global</h2>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {globalRanking.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum jogador no ranking ainda
                </div>
              ) : (
                globalRanking.map((rankEntry) => {
                  const isCurrentPlayer = rankEntry.player_id === player.id;
                  const medalEmoji = rankEntry.rank === 1 ? '🥇' : rankEntry.rank === 2 ? '🥈' : rankEntry.rank === 3 ? '🥉' : '';

                  return (
                    <div
                      key={rankEntry.id}
                      className={`p-4 rounded-xl transition-all ${
                        isCurrentPlayer
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 text-center">
                          {medalEmoji ? (
                            <span className="text-3xl">{medalEmoji}</span>
                          ) : (
                            <span className="text-2xl font-bold text-gray-600">#{rankEntry.rank}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{rankEntry.username}</h3>
                            {isCurrentPlayer && (
                              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                                VOCÊ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>🎯 {rankEntry.score.toLocaleString('pt-PT')} pts</span>
                            <span>📊 Nível {rankEntry.level}</span>
                            <span>🏆 {rankEntry.games_won} vitórias</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Match History Section */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📜 Histórico de Partidas</h2>
          
          <div className="space-y-3">
            {recentMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma partida jogada ainda
              </div>
            ) : (
              recentMatches.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {match.completed ? '🏆' : '🎮'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-lg">
                            {match.score.toLocaleString('pt-PT')} pontos
                          </span>
                          {match.completed && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold">
                              COMPLETA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>📞 {match.leads_captured} leads</span>
                          <span>🏠 {match.properties_acquired} propriedades</span>
                          <span>⏱️ {formatTime(match.time_played)}</span>
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium uppercase">
                            {match.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {formatDate(match.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
