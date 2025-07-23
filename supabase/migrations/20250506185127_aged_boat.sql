/*
  # Add location support to services

  1. Changes
    - Add location columns to services table:
      - `latitude` (numeric) - Service location latitude
      - `longitude` (numeric) - Service location longitude
      - `city` (text) - City name
    - Add location-based search capabilities
    - Add validation for coordinates

  2. Security
    - Maintain existing RLS policies
    - Add validation constraints for coordinates
*/

-- Add location columns to services table
ALTER TABLE services 
ADD COLUMN latitude numeric,
ADD COLUMN longitude numeric,
ADD COLUMN city text;

-- Add coordinate validation
ALTER TABLE services
ADD CONSTRAINT valid_latitude CHECK (latitude BETWEEN -90 AND 90),
ADD CONSTRAINT valid_longitude CHECK (longitude BETWEEN -180 AND 180);

-- Create a function for location-based search
CREATE OR REPLACE FUNCTION search_services_by_location(
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
) AS $$
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
    (
      6371 * acos(
        cos(radians(search_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(search_lng)) +
        sin(radians(search_lat)) * sin(radians(s.latitude))
      )
    ) as distance_km,
    c.name as category_name
  FROM services s
  JOIN categories c ON s.category_id = c.id
  WHERE (
    category_filter IS NULL OR 
    c.name = category_filter
  )
  AND s.latitude IS NOT NULL
  AND s.longitude IS NOT NULL
  HAVING distance_km <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;