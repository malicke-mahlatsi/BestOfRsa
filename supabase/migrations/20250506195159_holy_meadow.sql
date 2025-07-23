/*
  # Update search_services_by_location function
  
  1. Changes
    - Drop existing function to allow return type modification
    - Recreate function with updated return type including distance_km
    - Add category name to results
  
  2. Return Values
    - All service fields
    - Calculated distance in kilometers
    - Category name from joined categories table
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS search_services_by_location(numeric, numeric, numeric, text);

-- Create the updated function
CREATE FUNCTION search_services_by_location(
  search_lat NUMERIC,
  search_lng NUMERIC,
  radius_km NUMERIC DEFAULT 50,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category_id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  rating NUMERIC,
  phone TEXT,
  website TEXT,
  address TEXT,
  email TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ,
  distance_km NUMERIC,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.category_id,
    s.title,
    s.description,
    s.image_url,
    s.rating,
    s.phone,
    s.website,
    s.address,
    s.email,
    s.city,
    s.latitude,
    s.longitude,
    s.created_at,
    (
      6371 * acos(
        cos(radians(search_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(search_lng)) +
        sin(radians(search_lat)) * sin(radians(s.latitude))
      )
    )::NUMERIC AS distance_km,
    c.name AS category_name
  FROM services s
  LEFT JOIN categories c ON s.category_id = c.id
  WHERE (
    category_filter IS NULL OR 
    c.name = category_filter
  )
  AND (
    6371 * acos(
      cos(radians(search_lat)) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(search_lng)) +
      sin(radians(search_lat)) * sin(radians(s.latitude))
    )
  ) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;