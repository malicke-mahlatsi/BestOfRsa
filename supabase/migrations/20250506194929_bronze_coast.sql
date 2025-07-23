/*
  # Update search_services_by_location function
  
  1. Changes
    - Drop existing function to allow return type modification
    - Recreate function with updated return type and logic
    - Add category name to return values
    - Optimize distance calculation
    
  2. Return Values
    - All service fields
    - Category name
    - Distance in kilometers
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS search_services_by_location(numeric, numeric, numeric, text);

-- Create the updated function
CREATE FUNCTION search_services_by_location(
  search_lat numeric,
  search_lng numeric,
  radius_km numeric DEFAULT 10,
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
  distance_km numeric,
  category_name text
) LANGUAGE sql STABLE AS $$
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
    (
      6371 * acos(
        cos(radians(search_lat)) * 
        cos(radians(s.latitude)) * 
        cos(radians(s.longitude) - radians(search_lng)) + 
        sin(radians(search_lat)) * 
        sin(radians(s.latitude))
      )
    ) as distance_km,
    c.name as category_name
  FROM services s
  LEFT JOIN categories c ON s.category_id = c.id
  WHERE (
    category_filter IS NULL OR 
    c.name = category_filter
  )
  AND (
    6371 * acos(
      cos(radians(search_lat)) * 
      cos(radians(s.latitude)) * 
      cos(radians(s.longitude) - radians(search_lng)) + 
      sin(radians(search_lat)) * 
      sin(radians(s.latitude))
    )
  ) <= radius_km
  ORDER BY distance_km;
$$;