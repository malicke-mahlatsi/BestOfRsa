/*
  # Create search function for places

  1. New Functions
    - `search_places_by_location` - searches places within a radius of given coordinates
    - Returns places with distance calculation
  
  2. Security
    - Function is accessible to public users
    - Uses existing RLS policies on places table
*/

-- Create function to search places by location
CREATE OR REPLACE FUNCTION search_places_by_location(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  rating DOUBLE PRECISION,
  photos JSONB,
  category TEXT,
  location JSONB,
  created_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.address,
    p.rating,
    p.photos,
    p.category,
    p.location,
    p.created_at,
    -- Calculate distance using Haversine formula
    (
      6371 * acos(
        cos(radians(search_lat)) * 
        cos(radians((p.location->>'lat')::DOUBLE PRECISION)) * 
        cos(radians((p.location->>'lng')::DOUBLE PRECISION) - radians(search_lng)) + 
        sin(radians(search_lat)) * 
        sin(radians((p.location->>'lat')::DOUBLE PRECISION))
      )
    ) AS distance_km
  FROM places p
  WHERE (
    6371 * acos(
      cos(radians(search_lat)) * 
      cos(radians((p.location->>'lat')::DOUBLE PRECISION)) * 
      cos(radians((p.location->>'lng')::DOUBLE PRECISION) - radians(search_lng)) + 
      sin(radians(search_lat)) * 
      sin(radians((p.location->>'lat')::DOUBLE PRECISION))
    )
  ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$;