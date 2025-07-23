export interface Listing {
  id: string;
  name: string;
  score: number;
  category: string;
  subcategory: string;
  price_range: string;
  location: string;
  description: string;
  images: string[];
  amenities: string[];
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  featured?: boolean;
  operating_hours?: OperatingHours;
  popular_times?: PopularTimes;
  coordinates?: Coordinates;
  reviews?: Review[];
  contact?: Contact;
  detailed_description?: string;
  highlights?: string[];
  policies?: string[];
  
  // Category-specific data
  restaurant_data?: RestaurantData;
  hotel_data?: HotelData;
  activity_data?: ActivityData;
  attraction_data?: AttractionData;
}

export interface OperatingHours {
  Mon: string;
  Tue: string;
  Wed: string;
  Thu: string;
  Fri: string;
  Sat: string;
  Sun: string;
}

export interface PopularTimes {
  Mon: number[];
  Tue: number[];
  Wed: number[];
  Thu: number[];
  Fri: number[];
  Sat: number[];
  Sun: number[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  author_avatar?: string;
  verified?: boolean;
  photos?: string[];
  helpful_votes?: string[];
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories: string[];
  color: string;
}

export interface SearchFilters {
  searchQuery?: string;
  locations?: string[];
  priceRange?: string[];
  minRating?: number;
  amenities?: string[];
  categories?: string[];
  subcategories?: string[];
  category?: string;
  subcategory?: string;
}

// Category-specific interfaces
export interface RestaurantData {
  cuisines: string[];
  dietary_options: string[];
  popular_dishes: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  average_meal_price: string;
  dress_code?: string;
  reservations_required?: boolean;
}

export interface HotelData {
  star_rating: number;
  room_types: Array<{
    type: string;
    size: string;
    beds: string;
    price: number;
    image: string;
    amenities: string[];
  }>;
  hotel_amenities: string[];
  check_in: string;
  check_out: string;
  cancellation_policy: string;
  pet_policy?: string;
}

export interface ActivityData {
  duration: string;
  group_size: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Expert';
  age_restriction: string;
  included: string[];
  highlights: string[];
  requirements: string[];
  cancellation_policy: string;
  best_time: string;
}

export interface AttractionData {
  ticket_prices: Array<{
    type: string;
    price: number;
    description?: string;
  }>;
  best_time_to_visit: string;
  estimated_duration: string;
  accessibility: string[];
  facilities: string[];
  guided_tours_available: boolean;
  photography_allowed: boolean;
  location?: string;
}