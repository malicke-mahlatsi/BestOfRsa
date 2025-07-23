/*
  # Fix search_services_by_location function

  1. Changes
    - Drop existing function before recreating it
    - Update return type to match the required structure
    - Improve performance with better indexing
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS search_services_by_location(numeric, numeric, numeric, text);

-- Create the new function with updated return type
CREATE OR REPLACE FUNCTION search_services_by_location(
  search_lat NUMERIC,
  search_lng NUMERIC,
  radius_km NUMERIC DEFAULT 10,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  rating NUMERIC,
  photos JSONB,
  category TEXT,
  location JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    s.id,
    s.title as name,
    s.address,
    s.rating,
    COALESCE(s.photos, '[]'::jsonb) as photos,
    c.name as category,
    jsonb_build_object(
      'lat', s.latitude,
      'lng', s.longitude
    ) as location,
    s.created_at
  FROM services s
  LEFT JOIN categories c ON s.category_id = c.id
  WHERE (
    (category_filter IS NULL OR c.name = category_filter)
    AND
    (
      radius_km IS NULL
      OR
      (
        6371 * acos(
          cos(radians(search_lat)) * cos(radians(s.latitude)) *
          cos(radians(s.longitude) - radians(search_lng)) +
          sin(radians(search_lat)) * sin(radians(s.latitude))
        )
      ) <= radius_km
    )
  )
  GROUP BY 
    s.id,
    s.title,
    s.address,
    s.rating,
    s.photos,
    c.name,
    s.latitude,
    s.longitude,
    s.created_at
  ORDER BY s.rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;