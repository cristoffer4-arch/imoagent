-- LeadCity Gamification Tables
-- Tabelas para sistema de ranking, estatísticas e conquistas do LeadCity

-- Tabela de estatísticas de jogadores do LeadCity
CREATE TABLE IF NOT EXISTS leadcity_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  username VARCHAR(50) NOT NULL,
  total_score INTEGER DEFAULT 0,
  high_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_leads_collected INTEGER DEFAULT 0,
  total_properties_captured INTEGER DEFAULT 0,
  total_time_played INTEGER DEFAULT 0, -- em segundos
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  rank_position INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de histórico de partidas
CREATE TABLE IF NOT EXISTS leadcity_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES leadcity_players(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  leads_collected INTEGER DEFAULT 0,
  properties_captured INTEGER DEFAULT 0,
  time_played INTEGER NOT NULL, -- em segundos
  completed BOOLEAN DEFAULT false,
  level_reached INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de conquistas específicas do LeadCity
CREATE TABLE IF NOT EXISTS leadcity_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 0,
  requirement_type VARCHAR(50), -- 'score', 'leads', 'properties', 'games', 'time'
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de conquistas desbloqueadas pelos jogadores
CREATE TABLE IF NOT EXISTS leadcity_player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES leadcity_players(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES leadcity_achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, achievement_id)
);

-- Tabela de ranking global (materializada para performance)
CREATE TABLE IF NOT EXISTS leadcity_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES leadcity_players(id) ON DELETE CASCADE NOT NULL,
  ranking_type VARCHAR(50) NOT NULL, -- 'global', 'weekly', 'monthly'
  position INTEGER NOT NULL,
  score INTEGER NOT NULL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leadcity_players_user_id ON leadcity_players(user_id);
CREATE INDEX IF NOT EXISTS idx_leadcity_players_total_score ON leadcity_players(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leadcity_players_rank ON leadcity_players(rank_position);
CREATE INDEX IF NOT EXISTS idx_leadcity_matches_player ON leadcity_matches(player_id);
CREATE INDEX IF NOT EXISTS idx_leadcity_matches_created ON leadcity_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leadcity_rankings_type ON leadcity_rankings(ranking_type, position);

-- Função para atualizar ranking global
CREATE OR REPLACE FUNCTION update_leadcity_global_ranking()
RETURNS void AS $$
BEGIN
  -- Atualiza posições no ranking global
  WITH ranked_players AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_score DESC, high_score DESC) as new_position
    FROM leadcity_players
  )
  UPDATE leadcity_players p
  SET rank_position = rp.new_position
  FROM ranked_players rp
  WHERE p.id = rp.id;
  
  -- Atualiza tabela de rankings
  DELETE FROM leadcity_rankings WHERE ranking_type = 'global';
  
  INSERT INTO leadcity_rankings (player_id, ranking_type, position, score)
  SELECT 
    id,
    'global',
    rank_position,
    total_score
  FROM leadcity_players
  WHERE rank_position IS NOT NULL
  ORDER BY rank_position;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_leadcity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leadcity_players_updated_at
  BEFORE UPDATE ON leadcity_players
  FOR EACH ROW
  EXECUTE FUNCTION update_leadcity_updated_at();

-- Inserir conquistas padrão do LeadCity
INSERT INTO leadcity_achievements (code, name, description, icon, points, requirement_type, requirement_value) VALUES
  ('first_game', 'Primeira Partida', 'Complete sua primeira partida no LeadCity', '🎮', 10, 'games', 1),
  ('rookie_score', 'Pontuador Iniciante', 'Alcance 1000 pontos', '🌟', 20, 'score', 1000),
  ('pro_score', 'Pontuador Profissional', 'Alcance 5000 pontos', '⭐', 50, 'score', 5000),
  ('master_score', 'Mestre dos Pontos', 'Alcance 10000 pontos', '🏆', 100, 'score', 10000),
  ('lead_collector', 'Colecionador de Leads', 'Colete 100 leads', '💼', 30, 'leads', 100),
  ('property_hunter', 'Caçador de Imóveis', 'Capture 50 propriedades', '🏠', 40, 'properties', 50),
  ('dedicated_player', 'Jogador Dedicado', 'Jogue por 1 hora total', '⏱️', 25, 'time', 3600),
  ('marathon_player', 'Maratonista', 'Jogue por 5 horas totais', '🏃', 75, 'time', 18000),
  ('ten_games', 'Veterano', 'Complete 10 partidas', '🎲', 35, 'games', 10),
  ('fifty_games', 'Lenda do LeadCity', 'Complete 50 partidas', '👑', 100, 'games', 50)
ON CONFLICT (code) DO NOTHING;

-- RLS Policies
ALTER TABLE leadcity_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadcity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadcity_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadcity_player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadcity_rankings ENABLE ROW LEVEL SECURITY;

-- Policies para leadcity_players
CREATE POLICY "Users can view all players" ON leadcity_players FOR SELECT USING (true);
CREATE POLICY "Users can insert their own player" ON leadcity_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own player" ON leadcity_players FOR UPDATE USING (auth.uid() = user_id);

-- Policies para leadcity_matches
CREATE POLICY "Users can view their own matches" ON leadcity_matches FOR SELECT USING (
  player_id IN (SELECT id FROM leadcity_players WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own matches" ON leadcity_matches FOR INSERT WITH CHECK (
  player_id IN (SELECT id FROM leadcity_players WHERE user_id = auth.uid())
);

-- Policies para achievements (todos podem ver)
CREATE POLICY "Anyone can view achievements" ON leadcity_achievements FOR SELECT USING (true);

-- Policies para player_achievements
CREATE POLICY "Users can view their own achievements" ON leadcity_player_achievements FOR SELECT USING (
  player_id IN (SELECT id FROM leadcity_players WHERE user_id = auth.uid())
);
CREATE POLICY "Users can unlock their own achievements" ON leadcity_player_achievements FOR INSERT WITH CHECK (
  player_id IN (SELECT id FROM leadcity_players WHERE user_id = auth.uid())
);

-- Policies para rankings (todos podem ver)
CREATE POLICY "Anyone can view rankings" ON leadcity_rankings FOR SELECT USING (true);

