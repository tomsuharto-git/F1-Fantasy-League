-- ============================================================================
-- MIGRATION 003: Enforce Authentication (Email, Google, Apple)
-- ============================================================================
-- This migration updates the database to require authentication
-- Removes anonymous access and adds user profiles

-- ============================================================================
-- 1. CREATE USER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. UPDATE PLAYERS TABLE
-- ============================================================================

-- Make user_id required (will fail if there are existing NULL values)
-- Run this migration on a clean database or clean up anonymous players first
ALTER TABLE players
  ALTER COLUMN user_id SET NOT NULL;

-- Remove device_fingerprint (no longer needed)
ALTER TABLE players
  DROP COLUMN IF EXISTS device_fingerprint;

-- Add email for convenience
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Ensure one player per user per league
DROP INDEX IF EXISTS idx_players_one_per_league;
CREATE UNIQUE INDEX idx_players_one_per_league
  ON players(league_id, user_id);

-- ============================================================================
-- 3. UPDATE RLS POLICIES - REMOVE ANONYMOUS ACCESS
-- ============================================================================

-- LEAGUES: Remove anon policies
DROP POLICY IF EXISTS "Anyone can view leagues with share code" ON leagues;

-- Authenticated only
CREATE POLICY "Authenticated users can view leagues"
  ON leagues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "League creator can delete league"
  ON leagues FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- PLAYERS: Remove anon policies
DROP POLICY IF EXISTS "Anonymous users can create players" ON players;
DROP POLICY IF EXISTS "Anyone can view players in a league" ON players;

CREATE POLICY "Authenticated users can view players"
  ON players FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create verified players" ON players;
CREATE POLICY "Authenticated users can create their player"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RACES: Update to auth-only
DROP POLICY IF EXISTS "Anyone can view races" ON races;

CREATE POLICY "Authenticated users can view races"
  ON races FOR SELECT
  TO authenticated
  USING (true);

-- DRAFT PICKS: Update to auth-only
DROP POLICY IF EXISTS "Anyone can view draft picks" ON draft_picks;
DROP POLICY IF EXISTS "Players can create draft picks" ON draft_picks;

CREATE POLICY "Authenticated users can view draft picks"
  ON draft_picks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated players can create their draft picks"
  ON draft_picks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = player_id
      AND user_id = auth.uid()
    )
  );

-- RACE RESULTS: Update to auth-only
DROP POLICY IF EXISTS "Anyone can view race results" ON race_results;
DROP POLICY IF EXISTS "Players can insert their own results" ON race_results;
DROP POLICY IF EXISTS "Players can update their own results" ON race_results;

CREATE POLICY "Authenticated users can view race results"
  ON race_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated players can insert their results"
  ON race_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = player_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated players can update their results"
  ON race_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = player_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Get user's leagues
CREATE OR REPLACE FUNCTION get_user_leagues(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  league_id UUID,
  league_name TEXT,
  league_type TEXT,
  player_id UUID,
  player_name TEXT,
  player_color TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id as league_id,
    l.name as league_name,
    l.type as league_type,
    p.id as player_id,
    p.display_name as player_name,
    p.color as player_color,
    CASE
      WHEN l.created_by = user_uuid THEN 'creator'
      ELSE 'member'
    END as role,
    l.created_at
  FROM leagues l
  LEFT JOIN players p ON p.league_id = l.id AND p.user_id = user_uuid
  WHERE l.created_by = user_uuid
     OR EXISTS (
       SELECT 1 FROM players
       WHERE league_id = l.id AND user_id = user_uuid
     )
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Enable Email auth in Supabase Dashboard (Settings > Authentication > Providers)
-- 2. Configure Google OAuth (get client ID/secret from Google Cloud Console)
-- 3. Configure Apple Sign In (requires Apple Developer account)
-- 4. Add redirect URLs to each provider
-- 5. Update frontend to use Supabase Auth
