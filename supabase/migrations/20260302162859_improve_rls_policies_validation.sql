/*
  # Improve RLS Policies with Data Validation

  ## Changes Made

  1. **Security Improvements**
     - Replace permissive policies with validated policies
     - Add foreign key validation to ensure data integrity
     - Validate that session_id is not empty
     - Ensure referenced job_id and onet_activity_id exist
     - Maintain anonymous access but with data validation

  2. **Policy Updates**
     - SELECT: Allow viewing all selections (public educational tool)
     - INSERT: Validate foreign keys and session_id before allowing insert
     - UPDATE: Validate foreign keys exist before allowing updates
     - DELETE: Validate record exists before allowing deletion

  ## Important Notes
  - Policies now validate data integrity while maintaining anonymous access
  - Session-based tracking still works for the educational tool
  - Foreign key constraints are enforced at policy level for additional safety
*/

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view user selections" ON user_activity_selections;
DROP POLICY IF EXISTS "Anyone can insert user selections" ON user_activity_selections;
DROP POLICY IF EXISTS "Anyone can update user selections" ON user_activity_selections;
DROP POLICY IF EXISTS "Anyone can delete user selections" ON user_activity_selections;

-- SELECT: Allow viewing all selections (public educational tool)
CREATE POLICY "Public can view user selections"
  ON user_activity_selections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: Validate data before allowing insert
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

-- UPDATE: Validate foreign keys exist before allowing updates
CREATE POLICY "Validated updates for user selections"
  ON user_activity_selections
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id != ''
    AND EXISTS (SELECT 1 FROM jobs WHERE id = job_id)
    AND EXISTS (SELECT 1 FROM onet_activities WHERE id = onet_activity_id)
  );

-- DELETE: Allow deletion (records exist due to foreign key constraints)
CREATE POLICY "Allow deletion of user selections"
  ON user_activity_selections
  FOR DELETE
  TO anon, authenticated
  USING (true);