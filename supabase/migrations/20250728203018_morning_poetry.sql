/*
  # Create data quality scores table

  1. New Tables
    - `data_quality_scores`
      - `id` (uuid, primary key)
      - `place_id` (uuid, foreign key to places)
      - `name_score` (numeric, nullable)
      - `address_score` (numeric, nullable)
      - `contact_score` (numeric, nullable)
      - `description_score` (numeric, nullable)
      - `image_score` (numeric, nullable)
      - `completeness_score` (numeric, nullable)
      - `accuracy_score` (numeric, nullable)
      - `final_score` (numeric, nullable)
      - `calculated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `data_quality_scores` table
    - Add policy for public read access
    - Add policy for service role to manage scores
*/

CREATE TABLE IF NOT EXISTS data_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  name_score numeric,
  address_score numeric,
  contact_score numeric,
  description_score numeric,
  image_score numeric,
  completeness_score numeric,
  accuracy_score numeric,
  final_score numeric,
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE data_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on data_quality_scores"
  ON data_quality_scores
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage data_quality_scores"
  ON data_quality_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS data_quality_scores_place_id_idx ON data_quality_scores(place_id);
CREATE INDEX IF NOT EXISTS data_quality_scores_final_score_idx ON data_quality_scores(final_score);
CREATE INDEX IF NOT EXISTS data_quality_scores_calculated_at_idx ON data_quality_scores(calculated_at);