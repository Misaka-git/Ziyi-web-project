/*
  # Biology Jobs and NACE Competencies System

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text) - Job or activity title
      - `description` (text) - Brief description
      - `category` (text) - e.g., Research, Clinical, Education, Industry
      - `created_at` (timestamptz)
    
    - `nace_competencies`
      - `id` (uuid, primary key)
      - `name` (text) - Competency name
      - `description` (text) - Competency description
      - `created_at` (timestamptz)
    
    - `job_competencies`
      - `id` (uuid, primary key)
      - `job_id` (uuid, foreign key to jobs)
      - `competency_id` (uuid, foreign key to nace_competencies)
      - `importance_level` (text) - High, Medium, Low
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add public read policies (no auth required for this educational tool)
*/

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create NACE competencies table
CREATE TABLE IF NOT EXISTS nace_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create job_competencies junction table
CREATE TABLE IF NOT EXISTS job_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES nace_competencies(id) ON DELETE CASCADE,
  importance_level text NOT NULL DEFAULT 'Medium',
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, competency_id)
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nace_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_competencies ENABLE ROW LEVEL SECURITY;

-- Create public read policies (educational tool, no auth needed)
CREATE POLICY "Anyone can view jobs"
  ON jobs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view competencies"
  ON nace_competencies FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view job competencies"
  ON job_competencies FOR SELECT
  TO anon, authenticated
  USING (true);