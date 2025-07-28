import { supabase } from '../lib/supabase';
import { Place, ScrapingJob, DataQualityScore, BulkInsertResult, PlaceWithQuality } from '../types/database';

/**
 * Places API - Enhanced functions for the new database schema
 */

// Get all places with quality scores
export async function getPlacesWithQuality(filters?: {
  category_id?: string;
  city?: string;
  min_quality_score?: number;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('places_with_quality')
    .select('*')
    .eq('is_active', true);

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.city) {
    query = query.ilike('address', `%${filters.city}%`);
  }

  if (filters?.min_quality_score) {
    query = query.gte('data_quality_score', filters.min_quality_score);
  }

  if (filters?.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  query = query.order('data_quality_score', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data as PlaceWithQuality[];
}

// Get places by location radius
export async function getPlacesByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  category?: string
) {
  const { data, error } = await supabase.rpc('search_places_by_location', {
    search_lat: latitude,
    search_lng: longitude,
    radius_km: radiusKm,
    category_filter: category
  });

  if (error) throw error;
  return data;
}

// Bulk insert places using the database function
export async function bulkInsertPlaces(placesData: Partial<Place>[]): Promise<BulkInsertResult> {
  let inserted_count = 0;
  let duplicate_count = 0;
  let error_count = 0;
  const inserted_ids: string[] = [];

  for (const place of placesData) {
    try {
      // Check for duplicates first
      const { data: existing } = await supabase
        .from('places')
        .select('id')
        .eq('name', place.name || '')
        .eq('address', place.address || '')
        .single();

      if (existing) {
        duplicate_count++;
        continue;
      }

      // Insert new place
      const { data, error } = await supabase
        .from('places')
        .insert(place)
        .select('id')
        .single();

      if (error) {
        error_count++;
        console.error('Insert error:', error);
      } else {
        inserted_count++;
        inserted_ids.push(data.id);
      }
    } catch (err) {
      error_count++;
      console.error('Bulk insert error:', err);
    }
  }

  return {
    inserted_count,
    duplicate_count,
    error_count,
    inserted_ids
  };
}

// Calculate quality score for a place
export async function calculatePlaceQualityScore(placeId: string): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_place_quality_score', {
    place_id: placeId
  });

  if (error) throw error;
  return data as number;
}

// Get place by ID with quality score
export async function getPlaceById(id: string): Promise<PlaceWithQuality | null> {
  const { data, error } = await supabase
    .from('places_with_quality')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as PlaceWithQuality;
}

// Search places by text
export async function searchPlaces(
  searchTerm: string,
  filters?: {
    category_id?: string;
    min_rating?: number;
    price_range?: string[];
    limit?: number;
  }
): Promise<PlaceWithQuality[]> {
  let query = supabase
    .from('places_with_quality')
    .select('*')
    .eq('is_active', true);

  // Text search on name and description
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.min_rating) {
    query = query.gte('rating', filters.min_rating);
  }

  if (filters?.price_range && filters.price_range.length > 0) {
    query = query.in('price_range', filters.price_range);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order('data_quality_score', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data as PlaceWithQuality[];
}

// Update place
export async function updatePlace(id: string, updates: Partial<Place>): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Place;
}

// Create new place
export async function createPlace(place: Omit<Place, 'id' | 'created_at' | 'updated_at'>): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .insert(place)
    .select()
    .single();

  if (error) throw error;
  return data as Place;
}

// Delete place (soft delete by setting is_active to false)
export async function deletePlaceSoft(id: string): Promise<void> {
  const { error } = await supabase
    .from('places')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Hard delete place
export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Scraping Jobs API
 */

// Get all scraping jobs
export async function getScrapingJobs(filters?: {
  status?: string;
  city?: string;
  limit?: number;
}): Promise<ScrapingJob[]> {
  let query = supabase
    .from('scraping_jobs')
    .select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data as ScrapingJob[];
}

// Create scraping job
export async function createScrapingJob(
  job: Omit<ScrapingJob, 'id' | 'created_at'>
): Promise<ScrapingJob> {
  const { data, error } = await supabase
    .from('scraping_jobs')
    .insert(job)
    .select()
    .single();

  if (error) throw error;
  return data as ScrapingJob;
}

// Update scraping job
export async function updateScrapingJob(
  id: string, 
  updates: Partial<ScrapingJob>
): Promise<ScrapingJob> {
  const { data, error } = await supabase
    .from('scraping_jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ScrapingJob;
}

/**
 * Data Quality API
 */

// Get quality scores for a place
export async function getPlaceQualityScores(placeId: string): Promise<DataQualityScore[]> {
  const { data, error } = await supabase
    .from('data_quality_scores')
    .select('*')
    .eq('place_id', placeId)
    .order('calculated_at', { ascending: false });

  if (error) throw error;
  return data as DataQualityScore[];
}

// Get places with low quality scores
export async function getLowQualityPlaces(threshold: number = 50): Promise<PlaceWithQuality[]> {
  const { data, error } = await supabase
    .from('places_with_quality')
    .select('*')
    .lt('data_quality_score', threshold)
    .eq('is_active', true)
    .order('data_quality_score', { ascending: true });

  if (error) throw error;
  return data as PlaceWithQuality[];
}

// Get quality statistics
export async function getQualityStatistics() {
  const { data, error } = await supabase
    .from('places_with_quality')
    .select('data_quality_score, is_verified, is_featured')
    .eq('is_active', true);

  if (error) throw error;

  const stats = {
    total_places: data.length,
    verified_places: data.filter(p => p.is_verified).length,
    featured_places: data.filter(p => p.is_featured).length,
    high_quality: data.filter(p => (p.data_quality_score || 0) >= 80).length,
    medium_quality: data.filter(p => (p.data_quality_score || 0) >= 50 && (p.data_quality_score || 0) < 80).length,
    low_quality: data.filter(p => (p.data_quality_score || 0) < 50).length,
    average_quality: data.reduce((sum, p) => sum + (p.data_quality_score || 0), 0) / data.length
  };

  return stats;
}