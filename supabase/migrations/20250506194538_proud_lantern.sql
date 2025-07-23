/*
  # Create places table with location support

  1. New Tables
    - `places`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `address` (text)
      - `rating` (float, 0-5)
      - `photos` (jsonb array)
      - `category` (text, required)
      - `location` (jsonb with lat/lng)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `places` table
    - Add policy for public read access
    - Add policy for service role to insert data

  3. Indexes
    - Category index for filtering
    - Rating index for sorting
    - Location indexes for geographical queries
*/

CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  rating float CHECK (rating >= 0 AND rating <= 5),
  photos jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  location jsonb NOT NULL CHECK (
    jsonb_typeof(location->'lat') = 'number' AND
    jsonb_typeof(location->'lng') = 'number' AND
    (location->>'lat')::float BETWEEN -90 AND 90 AND
    (location->>'lng')::float BETWEEN -180 AND 180
  ),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on places"
  ON places
  FOR SELECT
  TO public
  USING (true);

-- Allow service role to insert data
CREATE POLICY "Allow service role to insert places"
  ON places
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS places_category_idx ON places (category);

-- Create index on rating for sorting
CREATE INDEX IF NOT EXISTS places_rating_idx ON places (rating);

-- Create indexes on location coordinates for geographical queries
CREATE INDEX IF NOT EXISTS places_lat_idx ON places USING gin ((location -> 'lat'));
CREATE INDEX IF NOT EXISTS places_lng_idx ON places USING gin ((location -> 'lng'));