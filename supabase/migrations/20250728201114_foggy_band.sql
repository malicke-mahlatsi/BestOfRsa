/*
  # Enhanced BestOfRSA Database Schema

  1. Enhanced Places Table
    - Added scraping metadata fields
    - Business details with JSONB for flexibility
    - Quality scoring and verification flags
    - Performance indexes

  2. New Tables
    - `scraping_jobs` - Track data collection jobs
    - `data_quality_scores` - Detailed quality metrics per place

  3. PostgreSQL Functions
    - `bulk_insert_places` - Bulk insert with duplicate detection
    - `update_updated_at_column` - Automatic timestamp updates

  4. Security
    - Row Level Security policies for all tables
    - Public read access with service role write access

  5. Performance
    - Strategic indexes for location, category, and quality queries
    - Optimized for search and filtering operations
*/

-- Drop existing places table if it exists to recreate with new schema
DROP TABLE IF EXISTS places CASCADE;

-- Enhanced places table with comprehensive fields
CREATE TABLE places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Category and service references
  category_id UUID REFERENCES categories(id),
  service_id UUID REFERENCES services(id),
  
  -- Business details
  description TEXT,
  opening_hours JSONB,
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  
  -- Features and amenities
  features TEXT[],
  amenities JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  
  -- Scraping metadata
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('osm', 'manual', 'api', 'scrape')) DEFAULT 'manual',
  data_quality_score DECIMAL(3, 2) DEFAULT 0.00 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  last_verified TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status flags
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scraping jobs table for tracking data collection
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL,
  source TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  attempts INTEGER DEFAULT 0,
  
  -- Progress tracking
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Error handling
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Data quality tracking table
CREATE TABLE IF NOT EXISTS data_quality_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  
  -- Individual component scores (0-100)
  name_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (name_score >= 0 AND name_score <= 100),
  address_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (address_score >= 0 AND address_score <= 100),
  contact_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (contact_score >= 0 AND contact_score <= 100),
  description_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (description_score >= 0 AND description_score <= 100),
  image_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (image_score >= 0 AND image_score <= 100),
  
  -- Overall metrics
  completeness_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  accuracy_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  final_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (final_score >= 0 AND final_score <= 100),
  
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST (
  ll_to_earth(latitude::float8, longitude::float8)
);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category_id);
CREATE INDEX IF NOT EXISTS idx_places_service ON places(service_id);
CREATE INDEX IF NOT EXISTS idx_places_quality ON places(data_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_places_active ON places(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_places_featured ON places(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_places_rating ON places(rating DESC) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_places_name_search ON places USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_places_description_search ON places USING gin(to_tsvector('english', description));

-- Scraping jobs indexes
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_city ON scraping_jobs(city, category);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created ON scraping_jobs(created_at DESC);

-- Data quality scores indexes
CREATE INDEX IF NOT EXISTS idx_quality_scores_place ON data_quality_scores(place_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_final ON data_quality_scores(final_score DESC);

-- Bulk insert function with advanced duplicate detection
CREATE OR REPLACE FUNCTION bulk_insert_places(places_data jsonb)
RETURNS TABLE (
  inserted_count INTEGER, 
  duplicate_count INTEGER, 
  error_count INTEGER,
  inserted_ids UUID[]
) AS $$
DECLARE
  inserted_count INTEGER := 0;
  duplicate_count INTEGER := 0;
  error_count INTEGER := 0;
  inserted_ids UUID[] := '{}';
  place_record RECORD;
  new_place_id UUID;
BEGIN
  -- Process each place in the input data
  FOR place_record IN 
    SELECT * FROM jsonb_array_elements(places_data)
  LOOP
    BEGIN
      -- Check for duplicates using multiple criteria
      IF EXISTS (
        SELECT 1 FROM places 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(place_record.value->>'name'))
        AND (
          (phone IS NOT NULL AND phone = place_record.value->>'phone') OR
          (website IS NOT NULL AND website = place_record.value->>'website') OR
          (
            latitude IS NOT NULL AND longitude IS NOT NULL AND
            ABS(latitude - (place_record.value->>'latitude')::DECIMAL) < 0.001 AND
            ABS(longitude - (place_record.value->>'longitude')::DECIMAL) < 0.001
          )
        )
      ) THEN
        duplicate_count := duplicate_count + 1;
      ELSE
        -- Insert new place
        INSERT INTO places (
          name, address, phone, website, email, latitude, longitude,
          category_id, description, features, source_type, source_url
        ) VALUES (
          TRIM(place_record.value->>'name'),
          NULLIF(TRIM(place_record.value->>'address'), ''),
          NULLIF(TRIM(place_record.value->>'phone'), ''),
          NULLIF(TRIM(place_record.value->>'website'), ''),
          NULLIF(TRIM(place_record.value->>'email'), ''),
          CASE WHEN place_record.value->>'latitude' != '' THEN (place_record.value->>'latitude')::DECIMAL ELSE NULL END,
          CASE WHEN place_record.value->>'longitude' != '' THEN (place_record.value->>'longitude')::DECIMAL ELSE NULL END,
          CASE WHEN place_record.value->>'category_id' != '' THEN (place_record.value->>'category_id')::UUID ELSE NULL END,
          NULLIF(TRIM(place_record.value->>'description'), ''),
          CASE WHEN place_record.value->>'features' != '' THEN string_to_array(place_record.value->>'features', ',') ELSE NULL END,
          COALESCE(place_record.value->>'source_type', 'api'),
          NULLIF(TRIM(place_record.value->>'source_url'), '')
        ) RETURNING id INTO new_place_id;
        
        inserted_count := inserted_count + 1;
        inserted_ids := array_append(inserted_ids, new_place_id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      -- Log error details (could be enhanced with error logging table)
      RAISE NOTICE 'Error inserting place %: %', place_record.value->>'name', SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT inserted_count, duplicate_count, error_count, inserted_ids;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate data quality score
CREATE OR REPLACE FUNCTION calculate_place_quality_score(place_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  place_record RECORD;
  name_score DECIMAL(5, 2) := 0;
  address_score DECIMAL(5, 2) := 0;
  contact_score DECIMAL(5, 2) := 0;
  description_score DECIMAL(5, 2) := 0;
  image_score DECIMAL(5, 2) := 0;
  final_score DECIMAL(5, 2) := 0;
BEGIN
  SELECT * INTO place_record FROM places WHERE id = place_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Name score (0-20 points)
  IF place_record.name IS NOT NULL AND LENGTH(TRIM(place_record.name)) >= 3 THEN
    name_score := 20;
  END IF;
  
  -- Address score (0-20 points)
  IF place_record.address IS NOT NULL AND LENGTH(TRIM(place_record.address)) >= 10 THEN
    address_score := 15;
  END IF;
  IF place_record.latitude IS NOT NULL AND place_record.longitude IS NOT NULL THEN
    address_score := address_score + 5;
  END IF;
  
  -- Contact score (0-25 points)
  IF place_record.phone IS NOT NULL THEN contact_score := contact_score + 8; END IF;
  IF place_record.website IS NOT NULL THEN contact_score := contact_score + 8; END IF;
  IF place_record.email IS NOT NULL THEN contact_score := contact_score + 9; END IF;
  
  -- Description score (0-20 points)
  IF place_record.description IS NOT NULL AND LENGTH(TRIM(place_record.description)) >= 50 THEN
    description_score := 20;
  ELSIF place_record.description IS NOT NULL AND LENGTH(TRIM(place_record.description)) >= 20 THEN
    description_score := 10;
  END IF;
  
  -- Image score (0-15 points)
  IF place_record.images IS NOT NULL AND array_length(place_record.images, 1) >= 3 THEN
    image_score := 15;
  ELSIF place_record.images IS NOT NULL AND array_length(place_record.images, 1) >= 1 THEN
    image_score := 8;
  END IF;
  
  final_score := name_score + address_score + contact_score + description_score + image_score;
  
  -- Insert or update quality score record
  INSERT INTO data_quality_scores (
    place_id, name_score, address_score, contact_score, 
    description_score, image_score, final_score
  ) VALUES (
    place_id, name_score, address_score, contact_score,
    description_score, image_score, final_score
  ) ON CONFLICT (place_id) DO UPDATE SET
    name_score = EXCLUDED.name_score,
    address_score = EXCLUDED.address_score,
    contact_score = EXCLUDED.contact_score,
    description_score = EXCLUDED.description_score,
    image_score = EXCLUDED.image_score,
    final_score = EXCLUDED.final_score,
    calculated_at = NOW();
  
  -- Update places table with calculated score
  UPDATE places SET data_quality_score = final_score WHERE id = place_id;
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_places_updated_at 
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_jobs_updated_at 
  BEFORE UPDATE ON scraping_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Setup
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for places table
CREATE POLICY "Allow public read access on places"
  ON places FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow service role full access on places"
  ON places FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert places"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for scraping_jobs table
CREATE POLICY "Allow service role full access on scraping_jobs"
  ON scraping_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read access on scraping_jobs"
  ON scraping_jobs FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for data_quality_scores table
CREATE POLICY "Allow public read access on data_quality_scores"
  ON data_quality_scores FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role full access on data_quality_scores"
  ON data_quality_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a view for places with quality scores
CREATE OR REPLACE VIEW places_with_quality AS
SELECT 
  p.*,
  dqs.final_score as quality_score,
  dqs.completeness_score,
  dqs.accuracy_score,
  dqs.calculated_at as quality_calculated_at
FROM places p
LEFT JOIN data_quality_scores dqs ON p.id = dqs.place_id
WHERE p.is_active = true;

-- Grant permissions on the view
GRANT SELECT ON places_with_quality TO public;
GRANT ALL ON places_with_quality TO service_role;