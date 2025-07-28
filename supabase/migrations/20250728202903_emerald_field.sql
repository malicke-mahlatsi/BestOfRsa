/*
  # Create bulk_insert_places function

  1. New Functions
    - `bulk_insert_places` - Handles bulk insertion of place data with duplicate detection
  
  2. Features
    - Duplicate detection based on name and address
    - Error handling for individual place insertions
    - Returns counts of inserted, duplicate, and error records
    - Returns array of inserted place IDs
  
  3. Security
    - Function is accessible to authenticated users and service role
*/

CREATE OR REPLACE FUNCTION public.bulk_insert_places(places_data jsonb)
RETURNS TABLE (
    inserted_count integer,
    duplicate_count integer,
    error_count integer,
    inserted_ids uuid[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    place_item jsonb;
    _inserted_count integer := 0;
    _duplicate_count integer := 0;
    _error_count integer := 0;
    _inserted_ids uuid[] := ARRAY[]::uuid[];
    existing_place_id uuid;
    new_place_id uuid;
BEGIN
    FOR place_item IN SELECT * FROM jsonb_array_elements(places_data)
    LOOP
        -- Check for duplicate based on name and address
        SELECT id INTO existing_place_id
        FROM public.places
        WHERE name = place_item->>'name'
          AND address = place_item->>'address'
        LIMIT 1;

        IF existing_place_id IS NOT NULL THEN
            _duplicate_count := _duplicate_count + 1;
        ELSE
            BEGIN
                INSERT INTO public.places (
                    name, address, phone, website, email, latitude, longitude,
                    category, description, rating, photos, location, source_type
                ) VALUES (
                    place_item->>'name',
                    place_item->>'address',
                    place_item->>'phone',
                    place_item->>'website',
                    place_item->>'email',
                    (place_item->>'latitude')::numeric,
                    (place_item->>'longitude')::numeric,
                    place_item->>'category',
                    place_item->>'description',
                    (place_item->>'rating')::double precision,
                    COALESCE(place_item->'photos', '[]'::jsonb),
                    jsonb_build_object(
                        'lat', (place_item->>'latitude')::numeric,
                        'lng', (place_item->>'longitude')::numeric
                    )
                )
                RETURNING id INTO new_place_id;

                _inserted_count := _inserted_count + 1;
                _inserted_ids := array_append(_inserted_ids, new_place_id);
            EXCEPTION
                WHEN OTHERS THEN
                    _error_count := _error_count + 1;
                    -- Log error details if needed
            END;
        END IF;
    END LOOP;

    RETURN QUERY SELECT _inserted_count, _duplicate_count, _error_count, _inserted_ids;
END;
$$;