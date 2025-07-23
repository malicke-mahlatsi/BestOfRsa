import { supabase } from '../lib/supabase';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getServicesByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('category_id', categoryId)
    .order('title');

  if (error) throw error;
  return data;
}

export async function searchServices(query: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('title');

  if (error) throw error;
  return data;
}

export async function getAllServices() {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order('title');

  if (error) throw error;
  return data;
}

export async function searchServicesByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  category?: string
) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-services`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
        radius: radiusKm,
        category,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch services');
  }

  const { data } = await response.json();
  return data;
}

export const cityCoordinates = {
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  'Johannesburg': { lat: -26.2041, lng: 28.0473 },
  'Durban': { lat: -29.8587, lng: 31.0218 },
  'Pretoria': { lat: -25.7479, lng: 28.2293 },
  'Port Elizabeth': { lat: -33.9608, lng: 25.6022 },
  'Bloemfontein': { lat: -29.0852, lng: 26.1596 },
  'Stellenbosch': { lat: -33.9321, lng: 18.8602 }
} as const;