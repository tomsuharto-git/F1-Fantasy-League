-- F1 Fantasy League - Initial Database Schema
-- Progressive Auth: Supports both anonymous and verified players

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  created_by TEXT, -- Can be anonymous or auth.users.id
  created_at TIMESTAMP DEFAULT NOW(),
  max_races INTEGER DEFAULT 1,
  drivers_per_team INTEGER DEFAULT 4,
  type TEXT CHECK (type IN ('race_day', 'season_league')) DEFAULT 'race_day',
  status TEXT CHECK (status IN ('setup', 'active', 'complete')) DEFAULT 'setup'
);

-- Players table (supports both anonymous and verified)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL,
  draft_position INTEGER,
  is_ready BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  device_fingerprint TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Races table
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  race_name TEXT NOT NULL,
  circuit TEXT,
  date DATE,
  session_key INTEGER, -- OpenF1 session identifier
  status TEXT CHECK (status IN ('upcoming', 'drafting', 'live', 'complete')) DEFAULT 'upcoming',
  draft_complete BOOLEAN DEFAULT false,
  results_finalized BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Draft picks table
CREATE TABLE draft_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  driver_code TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_number INTEGER NOT NULL,
  team TEXT NOT NULL,
  start_position INTEGER NOT NULL,
  pick_number INTEGER NOT NULL,
  picked_at TIMESTAMP DEFAULT NOW()
);

-- Race results table
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL,
  fastest_lap_driver TEXT,
  driver_results JSONB NOT NULL, -- Array of DriverResult
  finalized_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_players_league ON players(league_id);
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_verified ON players(is_verified);
CREATE INDEX idx_races_league ON races(league_id);
CREATE INDEX idx_draft_picks_race ON draft_picks(race_id);
CREATE INDEX idx_draft_picks_player ON draft_picks(player_id);
CREATE INDEX idx_race_results_race ON race_results(race_id);
CREATE INDEX idx_race_results_player ON race_results(player_id);
CREATE INDEX idx_leagues_share_code ON leagues(share_code);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

-- Leagues Policies
CREATE POLICY "Anyone can view leagues"
ON leagues FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can create leagues"
ON leagues FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Creator can update league"
ON leagues FOR UPDATE
TO anon, authenticated
USING (created_by = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'player_id'));

-- Players Policies
CREATE POLICY "Anyone can view players"
ON players FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anonymous can create players"
ON players FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND is_verified = false);

CREATE POLICY "Authenticated can create players"
ON players FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND is_verified = true);

CREATE POLICY "Players can update themselves"
ON players FOR UPDATE
TO anon, authenticated
USING (
  id::text = COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::json->>'player_id'
  )
);

-- Races Policies
CREATE POLICY "Anyone can view races"
ON races FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "League members can create races"
ON races FOR INSERT
TO anon, authenticated
WITH CHECK (
  league_id IN (
    SELECT league_id FROM players 
    WHERE id::text = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'player_id')
  )
);

-- Draft Picks Policies
CREATE POLICY "Anyone can view draft picks"
ON draft_picks FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Players can create picks"
ON draft_picks FOR INSERT
TO anon, authenticated
WITH CHECK (
  player_id::text = COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::json->>'player_id'
  )
);

-- Race Results Policies
CREATE POLICY "Anyone can view results"
ON race_results FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Players can create results"
ON race_results FOR INSERT
TO anon, authenticated
WITH CHECK (
  player_id::text = COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::json->>'player_id'
  )
);

-- =====================================================
-- VIEWS
-- =====================================================

-- Season Standings View
CREATE VIEW season_standings AS
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
      'points', rr.total_points,
      'position', (
        SELECT COUNT(*) + 1 
        FROM race_results rr2 
        WHERE rr2.race_id = r.id AND rr2.total_points > rr.total_points
      )
    ) ORDER BY r.race_number
  ) FILTER (WHERE rr.id IS NOT NULL) as race_breakdown
FROM players p
LEFT JOIN race_results rr ON p.id = rr.player_id
LEFT JOIN races r ON rr.race_id = r.id
GROUP BY p.league_id, p.id, p.display_name, p.color
ORDER BY total_points DESC;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate unique share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No confusing chars
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share code
CREATE OR REPLACE FUNCTION set_league_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
    NEW.share_code := generate_share_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM leagues WHERE share_code = NEW.share_code) LOOP
      NEW.share_code := generate_share_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_league_share_code
BEFORE INSERT ON leagues
FOR EACH ROW
EXECUTE FUNCTION set_league_share_code();

-- Trigger to update player updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_timestamp
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
