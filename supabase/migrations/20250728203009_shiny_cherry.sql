/*
  # Create scraping jobs table

  1. New Tables
    - `scraping_jobs`
      - `id` (uuid, primary key)
      - `job_type` (text, not null)
      - `source` (text, not null)
      - `city` (text, not null)
      - `category` (text, nullable)
      - `status` (text, not null, default 'pending')
      - `priority` (integer, default 1)
      - `attempts` (integer, default 0)
      - `total_items` (integer, nullable)
      - `processed_items` (integer, default 0)
      - `successful_items` (integer, default 0)
      - `failed_items` (integer, default 0)
      - `started_at` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `error_message` (text, nullable)
      - `metadata` (jsonb, nullable)

  2. Security
    - Enable RLS on `scraping_jobs` table
    - Add policy for public read access
    - Add policy for service role to manage jobs
*/

CREATE TABLE IF NOT EXISTS scraping_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  source text NOT NULL,
  city text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 1,
  attempts integer DEFAULT 0,
  total_items integer,
  processed_items integer DEFAULT 0,
  successful_items integer DEFAULT 0,
  failed_items integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  error_message text,
  metadata jsonb,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on scraping_jobs"
  ON scraping_jobs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage scraping_jobs"
  ON scraping_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS scraping_jobs_status_idx ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS scraping_jobs_city_idx ON scraping_jobs(city);
CREATE INDEX IF NOT EXISTS scraping_jobs_created_at_idx ON scraping_jobs(created_at);