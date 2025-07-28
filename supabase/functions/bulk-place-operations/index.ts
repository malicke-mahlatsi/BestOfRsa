import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BulkOperationRequest {
  operation: 'insert' | 'update' | 'calculate_quality' | 'verify_batch';
  places_data?: any[];
  place_ids?: string[];
  filters?: {
    category_id?: string;
    min_quality_score?: number;
    city?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { operation, places_data, place_ids, filters }: BulkOperationRequest = await req.json();

    let result;

    switch (operation) {
      case 'insert':
        if (!places_data || places_data.length === 0) {
          throw new Error('No places data provided for bulk insert');
        }

        result = await supabaseClient.rpc('bulk_insert_places', {
          places_data: places_data
        });

        if (result.error) throw result.error;
        break;

      case 'calculate_quality':
        if (!place_ids || place_ids.length === 0) {
          throw new Error('No place IDs provided for quality calculation');
        }

        const qualityResults = [];
        for (const placeId of place_ids) {
          const { data: score, error } = await supabaseClient.rpc('calculate_place_quality_score', {
            place_id: placeId
          });

          if (error) {
            console.error(`Error calculating quality for ${placeId}:`, error);
            qualityResults.push({ place_id: placeId, score: 0, error: error.message });
          } else {
            qualityResults.push({ place_id: placeId, score: score });
          }
        }

        result = { data: qualityResults };
        break;

      case 'verify_batch':
        if (!place_ids || place_ids.length === 0) {
          throw new Error('No place IDs provided for verification');
        }

        const { error: verifyError } = await supabaseClient
          .from('places')
          .update({ 
            is_verified: true, 
            last_verified: new Date().toISOString() 
          })
          .in('id', place_ids);

        if (verifyError) throw verifyError;

        result = { 
          data: { 
            verified_count: place_ids.length,
            verified_ids: place_ids 
          } 
        };
        break;

      case 'update':
        if (!places_data || places_data.length === 0) {
          throw new Error('No places data provided for bulk update');
        }

        const updateResults = [];
        for (const place of places_data) {
          if (!place.id) {
            updateResults.push({ error: 'Missing place ID', place });
            continue;
          }

          const { data, error } = await supabaseClient
            .from('places')
            .update(place)
            .eq('id', place.id)
            .select()
            .single();

          if (error) {
            updateResults.push({ error: error.message, place_id: place.id });
          } else {
            updateResults.push({ success: true, place_id: place.id, data });
          }
        }

        result = { data: updateResults };
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Bulk operation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});