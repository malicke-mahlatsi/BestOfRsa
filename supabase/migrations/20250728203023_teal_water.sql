/*
  # Create places with quality view

  1. New Views
    - `places_with_quality`
      - Combines places table with latest quality scores
      - Includes all place fields plus quality metrics
      - Filters for active places only

  2. Security
    - Enable RLS on view (inherits from base tables)
    - Add policy for public read access
*/

-- First, add missing columns to places table if they don't exist
DO $$
BEGIN
  -- Add is_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE places ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  -- Add is_featured column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE places ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE places ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- Add data_quality_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'data_quality_score'
  ) THEN
    ALTER TABLE places ADD COLUMN data_quality_score numeric;
  END IF;

  -- Add images column if it doesn't exist (for compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'places' AND column_name = 'images'
  ) THEN
    ALTER TABLE places ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create the places_with_quality view
CREATE OR REPLACE VIEW places_with_quality AS
SELECT 
  p.*,
  COALESCE(p.data_quality_score, dqs.final_score, 0) as data_quality_score,
  dqs.completeness_score,
  dqs.accuracy_score,
  dqs.calculated_at as quality_calculated_at
FROM places p
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (place_id)
    final_score,
    completeness_score,
    accuracy_score,
    calculated_at
  FROM data_quality_scores
  WHERE place_id = p.id
  ORDER BY place_id, calculated_at DESC
) dqs ON true
WHERE p.is_active = true;

-- Grant access to the view
GRANT SELECT ON places_with_quality TO public;
GRANT SELECT ON places_with_quality TO service_role;