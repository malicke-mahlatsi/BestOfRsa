/*
  # Create bulk_insert_places function

  1. New Functions
    - `bulk_insert_places` - Handles bulk insertion of place data with duplicate detection
  
  2. Features
    - Duplicate detection based on name and address
    - Error handling for invalid data
    - Returns insertion statistics (inserted, duplicates, errors)
    - Returns array of inserted IDs for tracking
  
  3. Security
    - Function is accessible to authenticated users
    - Handles data validation and type conversion
*/

CREATE OR REPLACE FUNCTION public.bulk_insert_places(places_data jsonb)
RETURNS TABLE (inserted_count integer, duplicate_count integer, error_count integer, inserted_ids uuid[]) AS $$
DECLARE
    place_json jsonb;
    inserted_c integer := 0;
    duplicate_c integer := 0;
    error_c integer := 0;
    inserted_ids_arr uuid[] := ARRAY[]::uuid[];
    new_place_id uuid;
    places_array jsonb[];
BEGIN
    -- Convert single jsonb to array if needed
    IF jsonb_typeof(places_data) = 'array' THEN
        SELECT array_agg(value) INTO places_array FROM jsonb_array_elements(places_data);
    ELSE
        places_array := ARRAY[places_data];
    END IF;

    FOR place_json IN SELECT unnest(places_array)
    LOOP
        BEGIN
            -- Check for existing place to avoid duplicates
            IF EXISTS (
                SELECT 1 FROM public.places 
                WHERE LOWER(name) = LOWER(place_json->>'name') 
                AND (
                    LOWER(COALESCE(address, '')) = LOWER(COALESCE(place_json->>'address', '')) OR
                    phone = place_json->>'phone'
                )
            ) THEN
                duplicate_c := duplicate_c + 1;
                CONTINUE;
            END IF;

            INSERT INTO public.places (
                name,
                address,
                phone,
                website,
                email,
                latitude,
                longitude,
                category_id,
                description,
                opening_hours,
                price_range,
                rating,
                review_count,
                features,
                amenities,
                images,
                source_url,
                source_type,
                data_quality_score,
                last_verified,
                scraped_at,
                is_verified,
                is_featured,
                is_active
            ) VALUES (
                place_json->>'name',
                place_json->>'address',
                place_json->>'phone',
                place_json->>'website',
                place_json->>'email',
                CASE 
                    WHEN place_json->>'latitude' IS NOT NULL AND place_json->>'latitude' != '' 
                    THEN (place_json->>'latitude')::numeric 
                    ELSE NULL 
                END,
                CASE 
                    WHEN place_json->>'longitude' IS NOT NULL AND place_json->>'longitude' != '' 
                    THEN (place_json->>'longitude')::numeric 
                    ELSE NULL 
                END,
                CASE 
                    WHEN place_json->>'category_id' IS NOT NULL AND place_json->>'category_id' != '' 
                    THEN (place_json->>'category_id')::uuid 
                    ELSE NULL 
                END,
                place_json->>'description',
                CASE 
                    WHEN place_json->'opening_hours' IS NOT NULL 
                    THEN place_json->'opening_hours' 
                    ELSE NULL 
                END,
                CASE 
                    WHEN place_json->>'price_range' IN ('$', '$$', '$$$', '$$$$') 
                    THEN place_json->>'price_range' 
                    ELSE NULL 
                END,
                CASE 
                    WHEN place_json->>'rating' IS NOT NULL AND place_json->>'rating' != '' 
                    THEN (place_json->>'rating')::numeric 
                    ELSE NULL 
                END,
                CASE 
                    WHEN place_json->>'review_count' IS NOT NULL AND place_json->>'review_count' != '' 
                    THEN (place_json->>'review_count')::integer 
                    ELSE 0 
                END,
                CASE 
                    WHEN place_json->'features' IS NOT NULL 
                    THEN ARRAY(SELECT jsonb_array_elements_text(place_json->'features'))
                    ELSE ARRAY[]::text[] 
                END,
                CASE 
                    WHEN place_json->'amenities' IS NOT NULL 
                    THEN place_json->'amenities' 
                    ELSE '{}'::jsonb 
                END,
                CASE 
                    WHEN place_json->'images' IS NOT NULL 
                    THEN ARRAY(SELECT jsonb_array_elements_text(place_json->'images'))
                    ELSE ARRAY[]::text[] 
                END,
                place_json->>'source_url',
                COALESCE(place_json->>'source_type', 'manual'),
                CASE 
                    WHEN place_json->>'data_quality_score' IS NOT NULL AND place_json->>'data_quality_score' != '' 
                    THEN (place_json->>'data_quality_score')::numeric 
                    ELSE 0.00 
                END,
                CASE 
                    WHEN place_json->>'last_verified' IS NOT NULL AND place_json->>'last_verified' != '' 
                    THEN (place_json->>'last_verified')::timestamp with time zone 
                    ELSE NULL 
                END,
                CASE 
                    WHEN place_json->>'scraped_at' IS NOT NULL AND place_json->>'scraped_at' != '' 
                    THEN (place_json->>'scraped_at')::timestamp with time zone 
                    ELSE now() 
                END,
                COALESCE((place_json->>'is_verified')::boolean, FALSE),
                COALESCE((place_json->>'is_featured')::boolean, FALSE),
                COALESCE((place_json->>'is_active')::boolean, TRUE)
            )
            RETURNING id INTO new_place_id;

            inserted_c := inserted_c + 1;
            inserted_ids_arr := array_append(inserted_ids_arr, new_place_id);

        EXCEPTION
            WHEN OTHERS THEN
                error_c := error_c + 1;
                RAISE WARNING 'Error inserting place: % - %', SQLSTATE, SQLERRM;
        END;
    END LOOP;

    RETURN QUERY SELECT inserted_c, duplicate_c, error_c, inserted_ids_arr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.bulk_insert_places(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_insert_places(jsonb) TO service_role;