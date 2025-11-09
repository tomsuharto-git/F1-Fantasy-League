-- F1 Fantasy League Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LEAGUES TABLE
-- ============================================================================
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  share_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
  type TEXT NOT NULL CHECK (type IN ('race_day', 'season_league')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_races INTEGER NOT NULL DEFAULT 1,
  drivers_per_team INTEGER NOT NULL DEFAULT 4 CHECK (drivers_per_team BETWEEN 3 AND 10),
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leagues_share_code ON leagues(share_code);
CREATE INDEX idx_leagues_created_by ON leagues(created_by);
CREATE INDEX idx_leagues_status ON leagues(status);

-- ============================================================================
-- PLAYERS TABLE
-- ============================================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL,
  draft_position INTEGER,
  is_ready BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(league_id, draft_position),
  UNIQUE(league_id, color)
);

CREATE INDEX idx_players_league ON players(league_id);
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_verified ON players(is_verified);

-- ============================================================================
-- RACES TABLE
-- ============================================================================
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  race_name TEXT NOT NULL,
  circuit TEXT,
  country TEXT,
  date DATE,
  session_key INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'drafting', 'live', 'complete')),
  draft_complete BOOLEAN DEFAULT false,
  results_finalized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(league_id, race_number)
);

CREATE INDEX idx_races_league ON races(league_id);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_session_key ON races(session_key);

-- ============================================================================
-- DRAFT PICKS TABLE
-- ============================================================================
CREATE TABLE draft_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  driver_code TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_number INTEGER,
  team TEXT,
  start_position INTEGER,
  pick_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(race_id, pick_number),
  UNIQUE(race_id, driver_code)
);

CREATE INDEX idx_draft_picks_race ON draft_picks(race_id);
CREATE INDEX idx_draft_picks_player ON draft_picks(player_id);
CREATE INDEX idx_draft_picks_pick_number ON draft_picks(pick_number);

-- ============================================================================
-- RACE RESULTS TABLE
-- ============================================================================
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  fastest_lap_driver TEXT,
  driver_results JSONB NOT NULL,
  finalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(race_id, player_id)
);

CREATE INDEX idx_race_results_race ON race_results(race_id);
CREATE INDEX idx_race_results_player ON race_results(player_id);

-- ============================================================================
-- SEASON STANDINGS VIEW
-- ============================================================================
CREATE OR REPLACE VIEW season_standings AS
SELECT 
  p.league_id,
  p.id as player_id,
  p.display_name as player_name,
  p.color,
  COALESCE(SUM(rr.total_points), 0) as total_points,
  COUNT(rr.id) as races_completed,
  json_agg(
    json_build_object(
      'race_id', r.id,
      'race_name', r.race_name,
      'race_number', r.race_number,
      'points', rr.total_points
    ) ORDER BY r.race_number
  ) FILTER (WHERE rr.id IS NOT NULL) as race_breakdown
FROM players p
LEFT JOIN race_results rr ON p.id = rr.player_id
LEFT JOIN races r ON rr.race_id = r.id
GROUP BY p.league_id, p.id, p.display_name, p.color
ORDER BY total_points DESC;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

-- LEAGUES POLICIES
CREATE POLICY "Anyone can view leagues with share code"
  ON leagues FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create leagues"
  ON leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "League creator can update league"
  ON leagues FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- PLAYERS POLICIES
CREATE POLICY "Anyone can view players in a league"
  ON players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anonymous users can create players"
  ON players FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND is_verified = false);

CREATE POLICY "Authenticated users can create verified players"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_verified = true);

CREATE POLICY "Users can update their own player"
  ON players FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own player"
  ON players FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RACES POLICIES
CREATE POLICY "Anyone can view races"
  ON races FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "League creator can create races"
  ON races FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leagues 
      WHERE id = league_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "League creator can update races"
  ON races FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues 
      WHERE id = league_id AND created_by = auth.uid()
    )
  );

-- DRAFT PICKS POLICIES
CREATE POLICY "Anyone can view draft picks"
  ON draft_picks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Players can create draft picks"
  ON draft_picks FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id = player_id AND league_id = (
        SELECT league_id FROM races WHERE id = race_id
      )
    )
  );

-- RACE RESULTS POLICIES
CREATE POLICY "Anyone can view race results"
  ON race_results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Players can insert their own results"
  ON race_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id = player_id
    )
  );

CREATE POLICY "Players can update their own results"
  ON race_results FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_id 
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
INSERT INTO leagues (name, type, max_races, drivers_per_team) 
VALUES ('Test League', 'race_day', 1, 4);
*/
