/*
  # Add O*NET Work Activities System

  1. New Tables
    - `onet_activities`
      - `id` (uuid, primary key)
      - `name` (text) - Activity name (e.g., "Analyzing Data or Information")
      - `description` (text) - Activity description
      - `nace_competency_id` (uuid, foreign key) - Maps to NACE competency
      - `created_at` (timestamptz)
    
    - `job_onet_activities`
      - `id` (uuid, primary key)
      - `job_id` (uuid, foreign key to jobs)
      - `onet_activity_id` (uuid, foreign key to onet_activities)
      - `created_at` (timestamptz)
      - Junction table linking jobs to relevant O*NET activities
    
    - `user_activity_selections`
      - `id` (uuid, primary key)
      - `session_id` (text) - Simple session identifier for tracking user selections
      - `job_id` (uuid, foreign key to jobs)
      - `onet_activity_id` (uuid, foreign key to onet_activities)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add public access policies (educational tool)

  3. Changes
    - Remove job_competencies table (no longer needed with O*NET approach)
*/

-- Drop old job_competencies table
DROP TABLE IF EXISTS job_competencies;

-- Create O*NET activities table
CREATE TABLE IF NOT EXISTS onet_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  nace_competency_id uuid NOT NULL REFERENCES nace_competencies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create job to O*NET activities junction table
CREATE TABLE IF NOT EXISTS job_onet_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  onet_activity_id uuid NOT NULL REFERENCES onet_activities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, onet_activity_id)
);

-- Create user selections table
CREATE TABLE IF NOT EXISTS user_activity_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  onet_activity_id uuid NOT NULL REFERENCES onet_activities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE onet_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_onet_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_selections ENABLE ROW LEVEL SECURITY;

-- Create public read policies
CREATE POLICY "Anyone can view O*NET activities"
  ON onet_activities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view job O*NET activities"
  ON job_onet_activities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view user selections"
  ON user_activity_selections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert user selections"
  ON user_activity_selections FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete user selections"
  ON user_activity_selections FOR DELETE
  TO anon, authenticated
  USING (true);