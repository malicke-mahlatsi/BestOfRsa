export interface ScraperConfig {
  maxRetries?: number;
  retryDelay?: number;
  requestsPerSecond?: number;
  timeout?: number;
  userAgents?: string[];
  proxy?: ProxyConfig;
}

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface ScraperResult {
  success: boolean;
  data?: ScrapedData;
  error?: string;
  url: string;
  timestamp: string;
}

export interface ScrapedData {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  images?: string[];
  coordinates?: { lat: number; lng: number };
  [key: string]: any;
}

export interface RestaurantData extends ScrapedData {
  cuisine?: string[];
  priceRange?: string | null;
  rating?: number | null;
  features?: string[];
  openingHours?: Record<string, string> | null;
}

export interface HotelData extends ScrapedData {
  starRating?: number;
  roomTypes?: Array<{
    type: string;
    price: number;
    amenities: string[];
  }>;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  cancellationPolicy?: string;
}

export interface AttractionData extends ScrapedData {
  ticketPrices?: Array<{
    type: string;
    price: number;
    description?: string;
  }>;
  openingHours?: Record<string, string>;
  bestTimeToVisit?: string;
  duration?: string;
  accessibility?: string[];
  facilities?: string[];
}

export interface ActivityData extends ScrapedData {
  duration?: string;
  groupSize?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Challenging' | 'Expert';
  ageRestriction?: string;
  included?: string[];
  requirements?: string[];
  bestTime?: string;
}