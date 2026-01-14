-- SQL Schema for IA Coaching Module
-- Tables for goals, KPIs, coaching sessions, action items, DISC profiles, user stats, and achievements

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  annual_revenue_target INTEGER NOT NULL,
  monthly_leads_target INTEGER NOT NULL,
  monthly_visits_target INTEGER NOT NULL,
  monthly_listings_target INTEGER NOT NULL,
  monthly_proposals_target INTEGER NOT NULL,
  monthly_closings_target INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs table
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  leads_generated INTEGER DEFAULT 0,
  visits_completed INTEGER DEFAULT 0,
  properties_listed INTEGER DEFAULT 0,
  properties_sold INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  commissions DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Coaching Sessions table (new structure for IA coaching)
CREATE TABLE IF NOT EXISTS coaching_sessions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('diagnosis', 'goal_setting', 'review', 'strategy', 'action_plan')),
  messages JSONB DEFAULT '[]',
  insights JSONB DEFAULT '[]',
  commitments JSONB DEFAULT '[]',
  follow_ups JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action Items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('calls', 'visits', 'prospecting', 'study', 'follow_up')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DISC Profiles table
CREATE TABLE IF NOT EXISTS disc_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  dominance INTEGER NOT NULL CHECK (dominance >= 0 AND dominance <= 100),
  influence INTEGER NOT NULL CHECK (influence >= 0 AND influence <= 100),
  steadiness INTEGER NOT NULL CHECK (steadiness >= 0 AND steadiness <= 100),
  conscientiousness INTEGER NOT NULL CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
  primary_style TEXT NOT NULL CHECK (primary_style IN ('D', 'I', 'S', 'C')),
  communication_tips JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  points INTEGER NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kpis_user_date ON kpis(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_kpis_date ON kpis(date DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_v2_user ON coaching_sessions_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_v2_created ON coaching_sessions_v2(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_items_user_status ON action_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);

CREATE INDEX IF NOT EXISTS idx_disc_profiles_user ON disc_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_disc_profiles_created ON disc_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level DESC);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned ON achievements(earned_at DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Goals policies
DROP POLICY IF EXISTS "goals_user_select" ON goals;
CREATE POLICY "goals_user_select" ON goals FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "goals_user_insert" ON goals;
CREATE POLICY "goals_user_insert" ON goals FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "goals_user_update" ON goals;
CREATE POLICY "goals_user_update" ON goals FOR UPDATE USING (auth.uid()::text = user_id);

-- KPIs policies
DROP POLICY IF EXISTS "kpis_user_select" ON kpis;
CREATE POLICY "kpis_user_select" ON kpis FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "kpis_user_insert" ON kpis;
CREATE POLICY "kpis_user_insert" ON kpis FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "kpis_user_update" ON kpis;
CREATE POLICY "kpis_user_update" ON kpis FOR UPDATE USING (auth.uid()::text = user_id);

-- Coaching Sessions policies
DROP POLICY IF EXISTS "coaching_sessions_v2_user_select" ON coaching_sessions_v2;
CREATE POLICY "coaching_sessions_v2_user_select" ON coaching_sessions_v2 FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "coaching_sessions_v2_user_insert" ON coaching_sessions_v2;
CREATE POLICY "coaching_sessions_v2_user_insert" ON coaching_sessions_v2 FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "coaching_sessions_v2_user_update" ON coaching_sessions_v2;
CREATE POLICY "coaching_sessions_v2_user_update" ON coaching_sessions_v2 FOR UPDATE USING (auth.uid()::text = user_id);

-- Action Items policies
DROP POLICY IF EXISTS "action_items_user_select" ON action_items;
CREATE POLICY "action_items_user_select" ON action_items FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "action_items_user_insert" ON action_items;
CREATE POLICY "action_items_user_insert" ON action_items FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "action_items_user_update" ON action_items;
CREATE POLICY "action_items_user_update" ON action_items FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "action_items_user_delete" ON action_items;
CREATE POLICY "action_items_user_delete" ON action_items FOR DELETE USING (auth.uid()::text = user_id);

-- DISC Profiles policies
DROP POLICY IF EXISTS "disc_profiles_user_select" ON disc_profiles;
CREATE POLICY "disc_profiles_user_select" ON disc_profiles FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "disc_profiles_user_insert" ON disc_profiles;
CREATE POLICY "disc_profiles_user_insert" ON disc_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "disc_profiles_user_update" ON disc_profiles;
CREATE POLICY "disc_profiles_user_update" ON disc_profiles FOR UPDATE USING (auth.uid()::text = user_id);

-- User Stats policies
DROP POLICY IF EXISTS "user_stats_user_select" ON user_stats;
CREATE POLICY "user_stats_user_select" ON user_stats FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "user_stats_user_insert" ON user_stats;
CREATE POLICY "user_stats_user_insert" ON user_stats FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "user_stats_user_update" ON user_stats;
CREATE POLICY "user_stats_user_update" ON user_stats FOR UPDATE USING (auth.uid()::text = user_id);

-- Allow reading all user stats for leaderboard
DROP POLICY IF EXISTS "user_stats_public_select" ON user_stats;
CREATE POLICY "user_stats_public_select" ON user_stats FOR SELECT USING (true);

-- Achievements policies
DROP POLICY IF EXISTS "achievements_user_select" ON achievements;
CREATE POLICY "achievements_user_select" ON achievements FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "achievements_user_insert" ON achievements;
CREATE POLICY "achievements_user_insert" ON achievements FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Allow reading all achievements for team visibility
DROP POLICY IF EXISTS "achievements_public_select" ON achievements;
CREATE POLICY "achievements_public_select" ON achievements FOR SELECT USING (true);

-- Comments
COMMENT ON TABLE goals IS 'User annual revenue goals and derived monthly targets';
COMMENT ON TABLE kpis IS 'Daily/weekly key performance indicators for consultants';
COMMENT ON TABLE coaching_sessions_v2 IS 'AI coaching sessions with messages and insights';
COMMENT ON TABLE action_items IS 'Daily action plan items with priorities and status';
COMMENT ON TABLE disc_profiles IS 'DISC behavioral analysis profiles with PNL communication tips';
COMMENT ON TABLE user_stats IS 'Gamification stats: points, level, streaks';
COMMENT ON TABLE achievements IS 'Earned badges and achievements for gamification';
