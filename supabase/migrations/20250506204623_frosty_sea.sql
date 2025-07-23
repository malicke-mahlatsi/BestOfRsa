/*
  # Places table setup

  1. Table Structure
    - Creates places table with UUID, name, address, rating, photos, category, location, and timestamp
    - Adds constraints for rating range and location coordinates
    - Creates indexes for optimized querying

  2. Security
    - Enables RLS
    - Adds policies for public read access and service role insert access
*/

-- Create places table if it doesn't exist
CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  rating double precision CHECK (rating >= 0 AND rating <= 5),
  photos jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  location jsonb NOT NULL CHECK (
    (jsonb_typeof(location->'lat') = 'number') AND
    (jsonb_typeof(location->'lng') = 'number') AND
    ((location->>'lat')::double precision BETWEEN -90 AND 90) AND
    ((location->>'lng')::double precision BETWEEN -180 AND 180)
  ),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS places_category_idx ON places(category);
CREATE INDEX IF NOT EXISTS places_rating_idx ON places(rating);
CREATE INDEX IF NOT EXISTS places_lat_idx ON places USING gin ((location->'lat'));
CREATE INDEX IF NOT EXISTS places_lng_idx ON places USING gin ((location->'lng'));

-- Enable Row Level Security
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read access on places" ON places;
  DROP POLICY IF EXISTS "Allow service role to insert places" ON places;
END $$;

-- Create policies
CREATE POLICY "Allow public read access on places"
  ON places
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to insert places"
  ON places
  FOR INSERT
  TO service_role
  WITH CHECK (true);