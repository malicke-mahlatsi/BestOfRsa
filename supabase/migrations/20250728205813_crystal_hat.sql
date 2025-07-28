/*
  # Add missing columns to places table

  1. New Columns
    - `description` (text) - Description of the place
    - `category_id` (uuid) - Foreign key to categories table
    - `service_id` (uuid) - Foreign key to services table
    - `opening_hours` (jsonb) - Opening hours data
    - `price_range` (text) - Price range indicator
    - `review_count` (integer) - Number of reviews
    - `features` (text[]) - Array of features
    - `amenities` (jsonb) - Amenities data
    - `images` (text[]) - Array of image URLs
    - `source_url` (text) - Source URL
    - `source_type` (text) - Source type
    - `data_quality_score` (numeric) - Quality score
    - `last_verified` (timestamptz) - Last verification date
    - `scraped_at` (timestamptz) - Scraping date
    - `is_verified` (boolean) - Verification status
    - `is_featured` (boolean) - Featured status
    - `is_active` (boolean) - Active status
    - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to places table
DO $$
BEGIN
  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'description'
  ) THEN
    ALTER TABLE places ADD COLUMN description text;
  END IF;

  -- Add category_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE places ADD COLUMN category_id uuid REFERENCES categories(id);
  END IF;

  -- Add service_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE places ADD COLUMN service_id uuid;
  END IF;

  -- Add opening_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'opening_hours'
  ) THEN
    ALTER TABLE places ADD COLUMN opening_hours jsonb;
  END IF;

  -- Add price_range column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE places ADD COLUMN price_range text CHECK (price_range IN ('$', '$$', '$$$', '$$$$'));
  END IF;

  -- Add review_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE places ADD COLUMN review_count integer DEFAULT 0;
  END IF;

  -- Add features column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'features'
  ) THEN
    ALTER TABLE places ADD COLUMN features text[];
  END IF;

  -- Add amenities column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'amenities'
  ) THEN
    ALTER TABLE places ADD COLUMN amenities jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add images column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'images'
  ) THEN
    ALTER TABLE places ADD COLUMN images text[];
  END IF;

  -- Add source_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE places ADD COLUMN source_url text;
  END IF;

  -- Add source_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE places ADD COLUMN source_type text CHECK (source_type IN ('osm', 'manual', 'api', 'scrape'));
  END IF;

  -- Add data_quality_score column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'data_quality_score'
  ) THEN
    ALTER TABLE places ADD COLUMN data_quality_score numeric CHECK (data_quality_score >= 0 AND data_quality_score <= 100);
  END IF;

  -- Add last_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'last_verified'
  ) THEN
    ALTER TABLE places ADD COLUMN last_verified timestamptz;
  END IF;

  -- Add scraped_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'scraped_at'
  ) THEN
    ALTER TABLE places ADD COLUMN scraped_at timestamptz;
  END IF;

  -- Add is_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE places ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  -- Add is_featured column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE places ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE places ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE places ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Add phone column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'phone'
  ) THEN
    ALTER TABLE places ADD COLUMN phone text;
  END IF;

  -- Add website column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'website'
  ) THEN
    ALTER TABLE places ADD COLUMN website text;
  END IF;

  -- Add email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'email'
  ) THEN
    ALTER TABLE places ADD COLUMN email text;
  END IF;

  -- Add latitude column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE places ADD COLUMN latitude numeric CHECK (latitude >= -90 AND latitude <= 90);
  END IF;

  -- Add longitude column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE places ADD COLUMN longitude numeric CHECK (longitude >= -180 AND longitude <= 180);
  END IF;
END $$;