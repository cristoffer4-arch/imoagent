import { createClient } from '@/lib/supabase/client';

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface LeadCityPlayer {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  games_played: number;
  games_won: number;
  highest_score: number;
  total_leads_captured: number;
  total_properties_acquired: number;
  total_time_played: number;
  level: number;
  experience_points: number;
  created_at: string;
  updated_at: string;
}

export interface LeadCityMatch {
  id: string;
  player_id: string;
  score: number;
  leads_captured: number;
  properties_acquired: number;
  time_played: number;
  difficulty: string;
  completed: boolean;
  created_at: string;
}

export interface LeadCityAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  created_at: string;
}

export interface LeadCityPlayerAchievement {
  id: string;
  player_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: LeadCityAchievement;
}

export interface LeadCityRanking {
  id: string;
  player_id: string;
  rank: number;
  score: number;
  username: string;
  level: number;
  games_won: number;
  updated_at: string;
}

export interface PlayerStats {
  player: LeadCityPlayer;
  achievements: LeadCityPlayerAchievement[];
  ranking: LeadCityRanking | null;
  recentMatches: LeadCityMatch[];
}

// ========================================
// SERVICE FUNCTIONS
// ========================================

/**
 * 1. Get or create a player for the current user
 */
export async function getOrCreatePlayer(userId: string, username: string): Promise<LeadCityPlayer> {
  const supabase = createClient();

  // Try to get existing player
  const { data: existingPlayer, error: fetchError } = await supabase
    .from('leadcity_players')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingPlayer && !fetchError) {
    return existingPlayer;
  }

  // Create new player if not found
  const newPlayer = {
    user_id: userId,
    username: username,
    total_score: 0,
    games_played: 0,
    games_won: 0,
    highest_score: 0,
    total_leads_captured: 0,
    total_properties_acquired: 0,
    total_time_played: 0,
    level: 1,
    experience_points: 0,
  };

  const { data, error } = await supabase
    .from('leadcity_players')
    .insert(newPlayer)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create player: ${error.message}`);
  }

  return data;
}

/**
 * 2. Get player statistics
 */
export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const supabase = createClient();

  // Get player data
  const { data: player, error: playerError } = await supabase
    .from('leadcity_players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (playerError) {
    throw new Error(`Failed to fetch player: ${playerError.message}`);
  }

  // Get achievements
  const { data: achievements, error: achievementsError } = await supabase
    .from('leadcity_player_achievements')
    .select(`
      *,
      achievement:leadcity_achievements(*)
    `)
    .eq('player_id', playerId)
    .order('unlocked_at', { ascending: false });

  // Get ranking
  const { data: ranking, error: rankingError } = await supabase
    .from('leadcity_rankings')
    .select('*')
    .eq('player_id', playerId)
    .single();

  // Get recent matches
  const { data: recentMatches, error: matchesError } = await supabase
    .from('leadcity_matches')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    player,
    achievements: achievements || [],
    ranking: ranking || null,
    recentMatches: recentMatches || [],
  };
}

/**
 * 3. Save match and update player stats
 */
export async function saveMatch(
  playerId: string,
  matchData: {
    score: number;
    leads_captured: number;
    properties_acquired: number;
    time_played: number;
    difficulty: string;
    completed: boolean;
  }
): Promise<LeadCityMatch> {
  const supabase = createClient();

  // Save match
  const { data: match, error: matchError } = await supabase
    .from('leadcity_matches')
    .insert({
      player_id: playerId,
      ...matchData,
    })
    .select()
    .single();

  if (matchError) {
    throw new Error(`Failed to save match: ${matchError.message}`);
  }

  // Get current player stats
  const { data: player, error: playerError } = await supabase
    .from('leadcity_players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (playerError) {
    throw new Error(`Failed to fetch player for update: ${playerError.message}`);
  }

  // Calculate new stats
  const newGamesPlayed = player.games_played + 1;
  const newGamesWon = matchData.completed ? player.games_won + 1 : player.games_won;
  const newTotalScore = player.total_score + matchData.score;
  const newHighestScore = Math.max(player.highest_score, matchData.score);
  const newTotalLeads = player.total_leads_captured + matchData.leads_captured;
  const newTotalProperties = player.total_properties_acquired + matchData.properties_acquired;
  const newTotalTime = player.total_time_played + matchData.time_played;
  const newExperiencePoints = player.experience_points + Math.floor(matchData.score / 10);
  const newLevel = Math.floor(newExperiencePoints / 1000) + 1;

  // Update player stats
  const { error: updateError } = await supabase
    .from('leadcity_players')
    .update({
      games_played: newGamesPlayed,
      games_won: newGamesWon,
      total_score: newTotalScore,
      highest_score: newHighestScore,
      total_leads_captured: newTotalLeads,
      total_properties_acquired: newTotalProperties,
      total_time_played: newTotalTime,
      experience_points: newExperiencePoints,
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId);

  if (updateError) {
    throw new Error(`Failed to update player stats: ${updateError.message}`);
  }

  // Check and unlock achievements
  await checkAndUnlockAchievements(playerId);

  // Update global ranking
  await updateGlobalRanking(playerId);

  return match;
}

/**
 * 4. Get global ranking
 */
export async function getGlobalRanking(limit: number = 100): Promise<LeadCityRanking[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leadcity_rankings')
    .select('*')
    .order('rank', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch global ranking: ${error.message}`);
  }

  return data || [];
}

/**
 * 5. Get all available achievements
 */
export async function getAllAchievements(): Promise<LeadCityAchievement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leadcity_achievements')
    .select('*')
    .order('points', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch achievements: ${error.message}`);
  }

  return data || [];
}

/**
 * 6. Get player achievements
 */
export async function getPlayerAchievements(playerId: string): Promise<LeadCityPlayerAchievement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leadcity_player_achievements')
    .select(`
      *,
      achievement:leadcity_achievements(*)
    `)
    .eq('player_id', playerId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch player achievements: ${error.message}`);
  }

  return data || [];
}

/**
 * 7. Check and unlock achievements for a player
 */
export async function checkAndUnlockAchievements(playerId: string): Promise<LeadCityPlayerAchievement[]> {
  const supabase = createClient();

  // Get player stats
  const { data: player, error: playerError } = await supabase
    .from('leadcity_players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (playerError || !player) {
    throw new Error(`Failed to fetch player: ${playerError?.message}`);
  }

  // Get all achievements
  const allAchievements = await getAllAchievements();

  // Get already unlocked achievements
  const unlockedAchievements = await getPlayerAchievements(playerId);
  const unlockedIds = new Set(unlockedAchievements.map(a => a.achievement_id));

  // Check each achievement
  const newlyUnlocked: LeadCityPlayerAchievement[] = [];

  for (const achievement of allAchievements) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) {
      continue;
    }

    let shouldUnlock = false;

    // Check achievement requirements
    switch (achievement.requirement_type) {
      case 'games_played':
        shouldUnlock = player.games_played >= achievement.requirement_value;
        break;
      case 'games_won':
        shouldUnlock = player.games_won >= achievement.requirement_value;
        break;
      case 'total_score':
        shouldUnlock = player.total_score >= achievement.requirement_value;
        break;
      case 'highest_score':
        shouldUnlock = player.highest_score >= achievement.requirement_value;
        break;
      case 'leads_captured':
        shouldUnlock = player.total_leads_captured >= achievement.requirement_value;
        break;
      case 'properties_acquired':
        shouldUnlock = player.total_properties_acquired >= achievement.requirement_value;
        break;
      case 'level':
        shouldUnlock = player.level >= achievement.requirement_value;
        break;
      case 'time_played':
        shouldUnlock = player.total_time_played >= achievement.requirement_value;
        break;
      default:
        shouldUnlock = false;
    }

    // Unlock achievement if criteria met
    if (shouldUnlock) {
      const { data: unlocked, error: unlockError } = await supabase
        .from('leadcity_player_achievements')
        .insert({
          player_id: playerId,
          achievement_id: achievement.id,
        })
        .select()
        .single();

      if (!unlockError && unlocked) {
        newlyUnlocked.push({
          ...unlocked,
          achievement,
        });
      }
    }
  }

  return newlyUnlocked;
}

/**
 * 8. Update global ranking for a player
 */
export async function updateGlobalRanking(playerId: string): Promise<void> {
  const supabase = createClient();

  // Get player data
  const { data: player, error: playerError } = await supabase
    .from('leadcity_players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (playerError || !player) {
    throw new Error(`Failed to fetch player: ${playerError?.message}`);
  }

  // Check if ranking exists
  const { data: existingRanking, error: fetchError } = await supabase
    .from('leadcity_rankings')
    .select('*')
    .eq('player_id', playerId)
    .single();

  const rankingData = {
    player_id: playerId,
    score: player.total_score,
    username: player.username,
    level: player.level,
    games_won: player.games_won,
  };

  if (existingRanking && !fetchError) {
    // Update existing ranking
    await supabase
      .from('leadcity_rankings')
      .update({
        ...rankingData,
        updated_at: new Date().toISOString(),
      })
      .eq('player_id', playerId);
  } else {
    // Insert new ranking
    await supabase
      .from('leadcity_rankings')
      .insert(rankingData);
  }

  // Recalculate all ranks (this could be optimized with a DB function)
  await recalculateRanks();
}

/**
 * Helper function to recalculate all ranks
 */
async function recalculateRanks(): Promise<void> {
  const supabase = createClient();

  // Get all rankings ordered by score
  const { data: rankings, error } = await supabase
    .from('leadcity_rankings')
    .select('*')
    .order('score', { ascending: false });

  if (error || !rankings) {
    return;
  }

  // Update each ranking with new rank
  for (let i = 0; i < rankings.length; i++) {
    await supabase
      .from('leadcity_rankings')
      .update({ rank: i + 1 })
      .eq('id', rankings[i].id);
  }
}

/**
 * 9. Get player match history
 */
export async function getPlayerMatches(
  playerId: string,
  limit: number = 50
): Promise<LeadCityMatch[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leadcity_matches')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch player matches: ${error.message}`);
  }

  return data || [];
}

/**
 * 10. Get top players
 */
export async function getTopPlayers(limit: number = 10): Promise<LeadCityPlayer[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leadcity_players')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch top players: ${error.message}`);
  }

  return data || [];
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get player by user ID
 */
export async function getPlayerByUserId(userId: string): Promise<LeadCityPlayer | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leadcity_players')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get player by ID
 */
export async function getPlayerById(playerId: string): Promise<LeadCityPlayer | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leadcity_players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Delete player (for testing/admin purposes)
 */
export async function deletePlayer(playerId: string): Promise<void> {
  const supabase = createClient();

  // Delete player (cascades to matches, achievements, ranking via DB constraints)
  const { error } = await supabase
    .from('leadcity_players')
    .delete()
    .eq('id', playerId);

  if (error) {
    throw new Error(`Failed to delete player: ${error.message}`);
  }
}
