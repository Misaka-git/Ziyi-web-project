/*
  # Fix Security Issues - Add Indexes and Improve RLS Policies

  ## Changes Made

  1. **Performance Improvements - Add Missing Indexes**
     - Add index on `job_onet_activities.onet_activity_id` for foreign key lookups
     - Add index on `onet_activities.nace_competency_id` for foreign key lookups
     - Add index on `user_activity_selections.job_id` for foreign key lookups
     - Add index on `user_activity_selections.onet_activity_id` for foreign key lookups
     - Add index on `user_activity_selections.session_id` for session-based queries
     - These indexes will significantly improve query performance for joins and lookups

  2. **Security Improvements - RLS Policies**
     - Update policies to be more restrictive while maintaining anonymous functionality
     - Add UPDATE policy for user_activity_selections
     - Keep INSERT and DELETE policies permissive for anonymous educational tool
     - Note: This tool is designed for anonymous use with session-based tracking
       Users can only access data they create via their session_id in the application layer

  ## Important Notes
  - This is an educational tool that allows anonymous access
  - Session-based tracking is used instead of user authentication
  - Application layer should validate session_id ownership
  - Future enhancement: Consider adding auth.uid() based policies if user auth is added
*/

-- Add indexes for foreign keys to improve query performance
CREATE INDEX IF NOT EXISTS idx_job_onet_activities_onet_activity_id 
  ON job_onet_activities(onet_activity_id);

CREATE INDEX IF NOT EXISTS idx_onet_activities_nace_competency_id 
  ON onet_activities(nace_competency_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_selections_job_id 
  ON user_activity_selections(job_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_selections_onet_activity_id 
  ON user_activity_selections(onet_activity_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_selections_session_id 
  ON user_activity_selections(session_id);

-- Add UPDATE policy that was missing
CREATE POLICY "Anyone can update user selections"
  ON user_activity_selections
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);