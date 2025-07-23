import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PlaceRequest {
  location: string;
  type: string;
  radius?: number;
}

interface Place {
  name: string;
  address: string;
  rating: number;
  photos: string[];
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  created_at: string;
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

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('Missing Google API Key');
    }

    const { location, type, radius = 5000 }: PlaceRequest = await req.json();

    if (!location || !type) {
      throw new Error('Missing required parameters');
    }

    const [lat, lng] = location.split(',').map(Number);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API Error: ${data.status}`);
    }

    const places: Place[] = data.results.map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating || 0,
      photos: place.photos ? place.photos.map((photo: any) => photo.photo_reference) : [],
      category: type,
      location: place.geometry.location,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseClient
      .from('places')
      .insert(places);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ message: 'Places fetched and stored successfully', places }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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