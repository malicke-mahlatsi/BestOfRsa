import axios from 'axios';
import { Place } from '../../types/database';
import pLimit from 'p-limit';

interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  extratags?: {
    website?: string;
    phone?: string;
    opening_hours?: string;
    cuisine?: string;
    email?: string;
  };
}

interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export class OSMDataService {
  private nominatimBase = 'https://nominatim.openstreetmap.org';
  private overpassBase = 'https://overpass-api.de/api/interpreter';
  private limit = pLimit(1); // Respect rate limits

  // Map OSM tags to our categories
  private categoryMappings = {
    restaurants: ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food'],
    hotels: ['tourism=hotel', 'tourism=motel', 'tourism=guest_house', 'tourism=hostel'],
    attractions: ['tourism=attraction', 'tourism=museum', 'tourism=gallery', 'historic=*'],
    activities: ['leisure=*', 'sport=*', 'tourism=theme_park', 'tourism=zoo']
  };

  constructor() {}

  // Search for places using Nominatim
  async searchPlaces(query: string, city: string): Promise<Place[]> {
    return this.limit(async () => {
      try {
        const response = await axios.get(`${this.nominatimBase}/search`, {
          params: {
            q: `${query}, ${city}, South Africa`,
            format: 'json',
            addressdetails: 1,
            extratags: 1,
            limit: 50
          },
          headers: {
            'User-Agent': 'BestOfRSA/1.0 (contact@bestofrsa.com)'
          }
        });

        return this.transformNominatimResults(response.data);
      } catch (error) {
        console.error('Nominatim search error:', error);
        return [];
      }
    });
  }

  // Bulk fetch POIs for a city using Overpass API
  async fetchCityPOIs(city: string, category: keyof typeof this.categoryMappings): Promise<Place[]> {
    const boundingBox = await this.getCityBoundingBox(city);
    if (!boundingBox) return [];

    const tags = this.categoryMappings[category];
    const overpassQuery = this.buildOverpassQuery(boundingBox, tags);

    try {
      const response = await axios.post(this.overpassBase, overpassQuery, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      return this.transformOverpassResults(response.data.elements, category);
    } catch (error) {
      console.error('Overpass API error:', error);
      return [];
    }
  }

  // Get city bounding box from Nominatim
  private async getCityBoundingBox(city: string): Promise<[number, number, number, number] | null> {
    return this.limit(async () => {
      try {
        const response = await axios.get(`${this.nominatimBase}/search`, {
          params: {
            q: `${city}, South Africa`,
            format: 'json',
            limit: 1
          },
          headers: {
            'User-Agent': 'BestOfRSA/1.0'
          }
        });

        if (response.data.length > 0) {
          const bbox = response.data[0].boundingbox;
          return bbox.map(Number) as [number, number, number, number];
        }

        return null;
      } catch (error) {
        console.error('Error getting city bounds:', error);
        return null;
      }
    });
  }

  // Build Overpass query
  private buildOverpassQuery(bbox: [number, number, number, number], tags: string[]): string {
    const [south, north, west, east] = bbox;
    const tagQueries = tags.map(tag => {
      const [key, value] = tag.split('=');
      return value === '*' ? `node["${key}"](${south},${west},${north},${east});` 
                           : `node["${key}"="${value}"](${south},${west},${north},${east});`;
    }).join('\n');

    return `
      [out:json][timeout:25];
      (
        ${tagQueries}
      );
      out body;
      >;
      out skel qt;
    `;
  }

  // Transform Nominatim results to our Place format
  private transformNominatimResults(results: NominatimResult[]): Place[] {
    return results.map(result => {
      const address = result.address;
      const fullAddress = [
        address?.house_number,
        address?.road,
        address?.suburb,
        address?.city,
        address?.state,
        address?.postcode
      ].filter(Boolean).join(', ');

      return {
        name: this.extractName(result.display_name),
        address: fullAddress,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        website: result.extratags?.website,
        source_type: 'osm',
        source_url: `https://www.openstreetmap.org/${result.osm_type}/${result.osm_id}`,
        features: this.extractFeatures(result.extratags || {}),
        opening_hours: this.parseOpeningHours(result.extratags?.opening_hours)
      } as Place;
    });
  }

  // Transform Overpass results
  private transformOverpassResults(nodes: OverpassNode[], category: string): Place[] {
    return nodes
      .filter(node => node.tags && node.tags.name) // Only include named places
      .map(node => {
        const tags = node.tags;
        
        return {
          name: tags.name,
          address: this.buildAddressFromTags(tags),
          location: {
            lat: node.lat,
            lng: node.lon
          }
        } as Place;
      });
  }

  // Helper methods
  private extractName(displayName: string): string {
    // Extract the first part before the first comma
    return displayName.split(',')[0].trim();
  }

  private buildAddressFromTags(tags: Record<string, string>): string {
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:suburb'],
      tags['addr:city'],
      tags['addr:postcode']
    ].filter(Boolean);

    return parts.join(', ') || tags['addr:full'] || '';
  }

  private normalizePhone(phone: string | undefined): string | undefined {
    if (!phone) return undefined;
    
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    
    // Add South Africa country code if missing
    if (normalized.length === 9 && normalized.startsWith('0')) {
      normalized = '27' + normalized.substring(1);
    } else if (normalized.length === 10 && normalized.startsWith('0')) {
      normalized = '27' + normalized.substring(1);
    }
    
    return normalized;
  }

  private extractFeatures(tags: Record<string, string>): string[] {
    const features: string[] = [];
    
    // Check for common amenities
    const amenityChecks = {
      'wheelchair': 'Wheelchair Accessible',
      'internet_access': 'Free WiFi',
      'outdoor_seating': 'Outdoor Seating',
      'takeaway': 'Takeaway Available',
      'delivery': 'Delivery Available',
      'reservation': 'Reservations Accepted',
      'parking': 'Parking Available'
    };

    for (const [key, label] of Object.entries(amenityChecks)) {
      if (tags[key] === 'yes') {
        features.push(label);
      }
    }

    return features;
  }

  private extractFeaturesFromTags(tags: Record<string, string>): string[] {
    const features = this.extractFeatures(tags);
    
    // Add cuisine types for restaurants
    if (tags.cuisine) {
      const cuisines = tags.cuisine.split(';').map(c => c.trim());
      features.push(...cuisines.map(c => `${c} Cuisine`));
    }
    
    // Add payment methods
    if (tags['payment:cash'] === 'yes') features.push('Cash Accepted');
    if (tags['payment:cards'] === 'yes') features.push('Cards Accepted');
    
    return features;
  }

  private parseOpeningHours(hours: string | undefined): any {
    if (!hours) return null;
    
    // OSM uses a complex format, simplified parsing here
    const daysMap: Record<string, string> = {
      'Mo': 'monday',
      'Tu': 'tuesday',
      'We': 'wednesday',
      'Th': 'thursday',
      'Fr': 'friday',
      'Sa': 'saturday',
      'Su': 'sunday'
    };

    const parsed: Record<string, string> = {};
    
    // Simple parser for common formats like "Mo-Fr 09:00-17:00"
    const matches = hours.matchAll(/([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+(\d{2}:\d{2}-\d{2}:\d{2})/g);
    
    for (const match of matches) {
      const [_, days, time] = match;
      if (days.includes('-')) {
        // Handle ranges
        const [start, end] = days.split('-');
        // Simplified: just use the time for all days in range
        parsed[daysMap[start] || start.toLowerCase()] = time;
        parsed[daysMap[end] || end.toLowerCase()] = time;
      } else {
        parsed[daysMap[days] || days.toLowerCase()] = time;
      }
    }
    
    return Object.keys(parsed).length > 0 ? parsed : null;
  }

  private getCategoryId(category: string): number {
    const categoryMap: Record<string, number> = {
      'restaurants': 1,
      'hotels': 2,
      'attractions': 3,
      'activities': 4
    };
    
    return categoryMap[category] || 0;
  }

  private getCategoryName(category: string): string {
    const categoryMap: Record<string, string> = {
      'restaurants': 'restaurants',
      'hotels': 'hotels',
      'attractions': 'attractions',
      'activities': 'activities'
    };
    
    return categoryMap[category] || 'general';
  }

  private extractAmenities(tags: Record<string, string>): Record<string, boolean> {
    return {
      wifi: tags.internet_access === 'yes' || tags.internet_access === 'wlan',
      parking: tags.parking === 'yes',
      wheelchair: tags.wheelchair === 'yes',
      smoking: tags.smoking === 'yes' || tags.smoking === 'outside',
      outdoor_seating: tags.outdoor_seating === 'yes',
      pet_friendly: tags.dog === 'yes' || tags.pets === 'yes'
    };
  }

  private inferPriceRange(tags: Record<string, string>): string | undefined {
    // OSM sometimes has price_range tag
    if (tags.price_range) {
      const priceMap: Record<string, string> = {
        'cheap': '$',
        'moderate': '$$',
        'expensive': '$$$',
        'very_expensive': '$$$$'
      };
      return priceMap[tags.price_range];
    }
    
    // Infer from stars for hotels
    if (tags.stars) {
      const stars = parseInt(tags.stars);
      if (stars <= 2) return '$';
      if (stars === 3) return '$$';
      if (stars === 4) return '$$$';
      if (stars >= 5) return '$$$$';
    }
    
    return undefined;
  }
}