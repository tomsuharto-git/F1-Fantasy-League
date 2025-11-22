-- Add missing INSERT policy for leagues table
-- This allows authenticated users to create leagues

CREATE POLICY "Authenticated users can create leagues"
  ON leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
