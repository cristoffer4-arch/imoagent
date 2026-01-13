// Game utilities for localStorage and scoring

import type { PlayerStats, GameScore, Badge } from '@/types/games';

const STORAGE_KEYS = {
  PLAYER_STATS: 'imoagent_player_stats',
  GAME_SCORES: 'imoagent_game_scores',
  BADGES: 'imoagent_badges',
  STREAKS: 'imoagent_streaks',
} as const;

// Initialize player stats
export function getPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') {
    return {
      totalPoints: 0,
      gamesPlayed: 0,
      badges: [],
      streaks: {},
      highScores: {},
    };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
  if (!stored) {
    const initialStats: PlayerStats = {
      totalPoints: 0,
      gamesPlayed: 0,
      badges: [],
      streaks: {},
      highScores: {},
    };
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(initialStats));
    return initialStats;
  }

  return JSON.parse(stored);
}

// Save player stats
export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
}

// Add points to player
export function addPoints(points: number): PlayerStats {
  const stats = getPlayerStats();
  stats.totalPoints += points;
  savePlayerStats(stats);
  return stats;
}

// Save game score
export function saveGameScore(score: GameScore): void {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem(STORAGE_KEYS.GAME_SCORES);
  const scores: GameScore[] = stored ? JSON.parse(stored) : [];
  scores.push(score);
  localStorage.setItem(STORAGE_KEYS.GAME_SCORES, JSON.stringify(scores));

  // Update high score
  const stats = getPlayerStats();
  const currentHigh = stats.highScores[score.gameId] || 0;
  if (score.score > currentHigh) {
    stats.highScores[score.gameId] = score.score;
    savePlayerStats(stats);
  }
}

// Get high score for a game
export function getHighScore(gameId: string): number {
  const stats = getPlayerStats();
  return stats.highScores[gameId] || 0;
}

// Unlock badge
export function unlockBadge(badge: Badge): PlayerStats {
  const stats = getPlayerStats();
  const alreadyHas = stats.badges.some(b => b.id === badge.id);
  
  if (!alreadyHas) {
    badge.unlockedAt = new Date();
    stats.badges.push(badge);
    savePlayerStats(stats);
  }
  
  return stats;
}

// Check if badge is unlocked
export function hasBadge(badgeId: string): boolean {
  const stats = getPlayerStats();
  return stats.badges.some(b => b.id === badgeId);
}

// Update streak
export function updateStreak(gameId: string): number {
  const stats = getPlayerStats();
  const today = new Date().toDateString();
  const lastPlayedKey = `${gameId}_last_played`;
  const lastPlayed = localStorage.getItem(lastPlayedKey);
  
  if (lastPlayed === today) {
    // Already played today
    return stats.streaks[gameId] || 0;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  if (lastPlayed === yesterdayStr) {
    // Consecutive day
    stats.streaks[gameId] = (stats.streaks[gameId] || 0) + 1;
  } else {
    // Streak broken, restart
    stats.streaks[gameId] = 1;
  }
  
  localStorage.setItem(lastPlayedKey, today);
  savePlayerStats(stats);
  
  return stats.streaks[gameId];
}

// Get streak
export function getStreak(gameId: string): number {
  const stats = getPlayerStats();
  return stats.streaks[gameId] || 0;
}

// Format time (seconds to MM:SS)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate bonus multiplier
export function calculateBonus(basePoints: number, options: {
  noHints?: boolean;
  timeBonus?: boolean;
  streak?: number;
}): number {
  let total = basePoints;
  
  if (options.noHints) {
    total *= 1.5; // +50%
  }
  
  if (options.timeBonus) {
    total *= 2; // +100%
  }
  
  if (options.streak && options.streak >= 5) {
    total *= 1.2; // +20% for 5+ day streak
  }
  
  return Math.round(total);
}

// Get all game scores
export function getGameScores(gameId?: string): GameScore[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEYS.GAME_SCORES);
  const scores: GameScore[] = stored ? JSON.parse(stored) : [];
  
  if (gameId) {
    return scores.filter(s => s.gameId === gameId);
  }
  
  return scores;
}

// Get leaderboard (top scores)
export function getLeaderboard(gameId: string, limit: number = 10): GameScore[] {
  const scores = getGameScores(gameId);
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
