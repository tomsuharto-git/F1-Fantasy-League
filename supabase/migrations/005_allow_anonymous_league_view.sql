-- ============================================================================
-- MIGRATION 005: Allow Anonymous League Viewing via Share Code
-- ============================================================================
-- This migration adds a policy to allow unauthenticated users to view
-- league details when joining via share code link.
-- All other league operations (INSERT, UPDATE, DELETE) remain auth-only.

-- Drop the existing authenticated-only SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view leagues" ON leagues;

-- Create new policy that allows both authenticated and anonymous users to view leagues
-- This is safe because it's read-only access
CREATE POLICY "Anyone can view leagues"
  ON leagues FOR SELECT
  USING (true);

-- Similarly, allow anonymous users to view players (needed for join page to show team members)
DROP POLICY IF EXISTS "Authenticated users can view players" ON players;

CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  USING (true);

-- ============================================================================
-- SECURITY NOTE
-- ============================================================================
-- This migration allows unauthenticated read access to leagues and players.
-- This is necessary for the join flow where users need to see league info
-- before signing in. All write operations still require authentication:
--
-- - Creating leagues: requires auth (migration 004)
-- - Creating players: requires auth (migration 003)
-- - Updating/deleting: requires auth (existing policies)
-- ============================================================================
