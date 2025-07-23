export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string | null
        }
      }
      services: {
        Row: {
          id: string
          category_id: string | null
          title: string
          description: string | null
          image_url: string | null
          rating: number | null
          phone: string | null
          website: string | null
          address: string | null
          email: string | null
          created_at: string | null
          latitude: number | null
          longitude: number | null
          city: string | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          title: string
          description?: string | null
          image_url?: string | null
          rating?: number | null
          phone?: string | null
          website?: string | null
          address?: string | null
          email?: string | null
          created_at?: string | null
          latitude?: number | null
          longitude?: number | null
          city?: string | null
        }
        Update: {
          id?: string
          category_id?: string | null
          title?: string
          description?: string | null
          image_url?: string | null
          rating?: number | null
          phone?: string | null
          website?: string | null
          address?: string | null
          email?: string | null
          created_at?: string | null
          latitude?: number | null
          longitude?: number | null
          city?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_services_by_location: {
        Args: {
          search_lat: number
          search_lng: number
          radius_km?: number
          category_filter?: string | null
        }
        Returns: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          rating: number | null
          phone: string | null
          website: string | null
          address: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          city: string | null
          distance_km: number
          category_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}