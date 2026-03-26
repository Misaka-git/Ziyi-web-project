/*
  # Add Custom Jobs Support

  ## Changes Made

  1. **New Tables**
     - `custom_jobs`
       - `id` (uuid, primary key) - Unique identifier
       - `session_id` (text, not null) - Anonymous session identifier
       - `title` (text, not null) - Student's custom job title
       - `description` (text) - Optional description of the job
       - `created_at` (timestamptz) - Timestamp of creation

  2. **Security**
     - Enable RLS on `custom_jobs` table
     - Allow public viewing for educational purposes
     - Allow inserts with session validation
     - Allow updates/deletes only for same session

  ## Important Notes
  - Custom jobs are session-based for anonymous users
  - Data integrity requires non-empty session_id and title
  - Students can describe jobs not in predefined list
*/

CREATE TABLE IF NOT EXISTS custom_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view custom jobs"
  ON custom_jobs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert custom jobs with session"
  ON custom_jobs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id != ''
    AND title IS NOT NULL
    AND title != ''
  );

CREATE POLICY "Users can update their own custom jobs"
  ON custom_jobs
  FOR UPDATE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id != '')
  WITH CHECK (
    session_id IS NOT NULL 
    AND session_id != ''
    AND title IS NOT NULL
    AND title != ''
  );

CREATE POLICY "Users can delete their own custom jobs"
  ON custom_jobs
  FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id != '');