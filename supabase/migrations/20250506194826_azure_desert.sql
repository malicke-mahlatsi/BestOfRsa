/*
  # Fix search_services_by_location function

  1. Changes
    - Fix the GROUP BY clause in search_services_by_location function
    - Ensure all selected columns are either in GROUP BY or used in aggregate functions
    - Maintain proper distance calculation and sorting

  2. Security
    - Function remains accessible to all users (SECURITY DEFINER)
*/

CREATE OR REPLACE FUNCTION search_services_by_location(
  lat double precision,
  lng double precision,
  radius double precision DEFAULT 10000,
  search_term text DEFAULT ''
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
  distance double precision,
  category_name text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
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
        cos(radians(lat)) * 
        cos(radians(s.latitude::float)) * 
        cos(radians(s.longitude::float) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(s.latitude::float))
      )
    ) AS distance,
    c.name as category_name
  FROM services s
  LEFT JOIN categories c ON s.category_id = c.id
  WHERE 
    (
      LOWER(s.title) LIKE '%' || LOWER(search_term) || '%'
      OR LOWER(s.description) LIKE '%' || LOWER(search_term) || '%'
      OR LOWER(c.name) LIKE '%' || LOWER(search_term) || '%'
    )
  AND (
    6371 * acos(
      cos(radians(lat)) * 
      cos(radians(s.latitude::float)) * 
      cos(radians(s.longitude::float) - radians(lng)) + 
      sin(radians(lat)) * 
      sin(radians(s.latitude::float))
    )
  ) <= radius
  ORDER BY distance;
$$;