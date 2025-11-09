-- Migration: Fix draft_picks policies and enable realtime
-- This fixes the issue where draft picks don't work and undo doesn't work

-- Add DELETE policy for draft_picks (needed for undo functionality)
CREATE POLICY "Players can delete draft picks"
  ON draft_picks FOR DELETE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = player_id AND league_id = (
        SELECT league_id FROM races WHERE id = race_id
      )
    )
  );

-- Enable realtime for draft_picks table
ALTER TABLE draft_picks REPLICA IDENTITY FULL;

-- Enable realtime publication (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE draft_picks;
