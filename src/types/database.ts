export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  [key: string]: string | undefined;
}

export interface Place {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  category_id?: string;
  service_id?: string;
  description?: string;
  opening_hours?: OpeningHours;
  price_range?: '$' | '$$' | '$$$' | '$$$$';
  rating?: number;
  review_count?: number;
  features?: string[];
  amenities?: Record<string, boolean>;
  images?: string[];
  source_url?: string;
  source_type?: 'osm' | 'manual' | 'api' | 'scrape';
  data_quality_score?: number;
  last_verified?: string;
  scraped_at?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ScrapingJob {
  id: string;
  job_type: string;
  source: string;
  city: string;
  category?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  attempts: number;
  total_items?: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface DataQualityScore {
  id: string;
  place_id: string;
  name_score?: number;
  address_score?: number;
  contact_score?: number;
  description_score?: number;
  image_score?: number;
  completeness_score?: number;
  accuracy_score?: number;
  final_score?: number;
  calculated_at?: string;
}

export interface PlaceWithQuality extends Place {
  quality_score?: number;
  completeness_score?: number;
  accuracy_score?: number;
  quality_calculated_at?: string;
}

// Bulk insert function response type
export interface BulkInsertResult {
  inserted_count: number;
  duplicate_count: number;
  error_count: number;
  inserted_ids: string[];
}

// Database function types
export type DatabaseFunctions = {
  bulk_insert_places: {
    Args: { places_data: any };
    Returns: BulkInsertResult[];
  };
  calculate_place_quality_score: {
    Args: { place_id: string };
    Returns: number;
  };
};

// Enhanced database schema type
export interface Database {
  public: {
    Tables: {
      places: {
        Row: Place;
        Insert: Omit<Place, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Place, 'id' | 'created_at'>>;
      };
      scraping_jobs: {
        Row: ScrapingJob;
        Insert: Omit<ScrapingJob, 'id' | 'created_at'>;
        Update: Partial<Omit<ScrapingJob, 'id' | 'created_at'>>;
      };
      data_quality_scores: {
        Row: DataQualityScore;
        Insert: Omit<DataQualityScore, 'id' | 'calculated_at'>;
        Update: Partial<Omit<DataQualityScore, 'id' | 'calculated_at'>>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          image_url: string | null;
          rating: number | null;
          phone: string | null;
          website: string | null;
          address: string | null;
          email: string | null;
          created_at: string | null;
          latitude: number | null;
          longitude: number | null;
          city: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          image_url?: string | null;
          rating?: number | null;
          phone?: string | null;
          website?: string | null;
          address?: string | null;
          email?: string | null;
          created_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          rating?: number | null;
          phone?: string | null;
          website?: string | null;
          address?: string | null;
          email?: string | null;
          created_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          city?: string | null;
        };
      };
    };
    Views: {
      places_with_quality: {
        Row: PlaceWithQuality;
      };
    };
    Functions: DatabaseFunctions;
    Enums: {
      [_ in never]: never;
    };
  };
}