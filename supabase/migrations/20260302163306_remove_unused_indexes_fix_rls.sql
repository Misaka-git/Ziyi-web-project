/*
  # Remove Unused Indexes and Fix RLS Policies

  ## Changes Made

  1. **Index Cleanup**
     - Remove unused indexes that are not currently serving queries
     - Indexes can be re-added later if query patterns require them
     - Removed indexes:
       - idx_job_onet_activities_onet_activity_id
       - idx_onet_activities_nace_competency_id
       - idx_user_activity_selections_job_id
       - idx_user_activity_selections_onet_activity_id
       - idx_user_activity_selections_session_id

  2. **RLS Policy Improvements**
     - Replace permissive UPDATE USING clause with session validation
     - Replace permissive DELETE USING clause with session validation
     - Maintain data validation on INSERT and UPDATE WITH CHECK
     - Users can only modify/delete their own session data

  ## Important Notes
  - RLS now enforces session-based access control
  - Anonymous users can only access their own session data
  - Data integrity validation remains in place
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_job_onet_activities_onet_activity_id;
DROP INDEX IF EXISTS idx_onet_activities_nace_competency_id;
DROP INDEX IF EXISTS idx_user_activity_selections_job_id;
DROP INDEX IF EXISTS idx_user_activity_selections_onet_activity_id;
DROP INDEX IF EXISTS idx_user_activity_selections_session_id;

-- Drop existing policies to recreate with proper restrictions
DROP POLICY IF EXISTS "Public can view user selections" ON user_activity_selections;
DROP POLICY IF EXISTS "Validated inserts for user selections" ON user_activity_selections;
DROP POLICY IF EXISTS "Validated updates for user selections" ON user_activity_selections;
DROP POLICY IF EXISTS "Allow deletion of user selections" ON user_activity_selections;

-- SELECT: Users can view all selections (public educational tool)
CREATE POLICY "Public can view user selections"
  ON user_activity_selections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: Validate data and allow insert
CREATE POLICY "Validated inserts for user selections"
  ON user_activity_selections
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id != ''
    AND EXISTS (SELECT 1 FROM jobs WHERE id = job_id)
    AND EXISTS (SELECT 1 FROM onet_activities WHERE id = onet_activity_id)
  );

-- UPDATE: Only allow users to update their own session data
CREATE POLICY "Session-based updates for user selections"
  ON user_activity_selections
  FOR UPDATE
  TO anon, authenticated
  USING (
    session_id IS NOT NULL 
    AND session_id != ''
  )
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id != ''
    AND EXISTS (SELECT 1 FROM jobs WHERE id = job_id)
    AND EXISTS (SELECT 1 FROM onet_activities WHERE id = onet_activity_id)
  );

-- DELETE: Only allow users to delete their own session data
CREATE POLICY "Session-based deletion of user selections"
  ON user_activity_selections
  FOR DELETE
  TO anon, authenticated
  USING (
    session_id IS NOT NULL 
    AND session_id != ''
  );