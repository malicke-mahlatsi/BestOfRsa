/*
  # Add search_services_by_location RPC function

  1. New Functions
    - `search_services_by_location` - Searches services by geographic location with distance calculation
      - Parameters: search_lat (double precision), search_lng (double precision), radius_km (double precision, default 50), category_filter (text, optional)
      - Returns: Services with calculated distance, joined with category names

  2. Security
    - Function is accessible to public users for read operations
*/

-- Create the search_services_by_location function
CREATE OR REPLACE FUNCTION search_services_by_location(
  search_lat double precision,
  search_lng double precision,
  radius_km double precision DEFAULT 50,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  image_url text,
  rating numeric,
  phone text,
  website text,
  address text,
  email text,
  latitude numeric,
  longitude numeric,
  city text,
  distance_km double precision,
  category_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.image_url,
    s.rating,
    s.phone,
    s.website,
    s.address,
    s.email,
    s.latitude,
    s.longitude,
    s.city,
    -- Calculate distance using Haversine formula (approximate)
    (
      6371 * acos(
        cos(radians(search_lat)) * 
        cos(radians(s.latitude::double precision)) * 
        cos(radians(s.longitude::double precision) - radians(search_lng)) + 
        sin(radians(search_lat)) * 
        sin(radians(s.latitude::double precision))
      )
    )::double precision AS distance_km,
    COALESCE(c.name, 'Uncategorized') AS category_name
  FROM services s
  LEFT JOIN categories c ON s.category_id = c.id
  WHERE 
    s.latitude IS NOT NULL 
    AND s.longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(search_lat)) * 
        cos(radians(s.latitude::double precision)) * 
        cos(radians(s.longitude::double precision) - radians(search_lng)) + 
        sin(radians(search_lat)) * 
        sin(radians(s.latitude::double precision))
      )
    ) <= radius_km
    AND (category_filter IS NULL OR c.name = category_filter)
  ORDER BY distance_km ASC;
END;
$$;