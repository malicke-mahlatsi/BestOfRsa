import { PerplexityDataParser } from '../utils/PerplexityDataParser';
import { DataValidator } from '../utils/DataValidator';
import { DuplicateDetector } from '../utils/DuplicateDetector';
import { ContentEnhancementEngine } from '../utils/ContentEnhancementEngine';
import { Place } from '../types/database';
import { supabase } from '../lib/supabase';

export interface PipelineResult {
  original: any;
  validated: Place;
  confidence: number;
  isDuplicate: boolean;
  duplicateOf?: string;
  enhanced?: any;
  errors: string[];
  warnings: string[];
}

export class DataPipeline {
  private parser: PerplexityDataParser;
  private validator: DataValidator;
  private duplicateDetector: DuplicateDetector;
  private enhancer: ContentEnhancementEngine;

  constructor() {
    this.parser = new PerplexityDataParser();
    this.validator = new DataValidator();
    this.duplicateDetector = new DuplicateDetector();
    this.enhancer = new ContentEnhancementEngine();
  }

  // Process a single item through the pipeline
  async process(data: any, options: {
    skipDuplicateCheck?: boolean;
    skipEnhancement?: boolean;
    category?: string;
  } = {}): Promise<PipelineResult> {
    const result: PipelineResult = {
      original: data,
      validated: {} as Place,
      confidence: 0,
      isDuplicate: false,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Parse data if it's raw text
      let parsed = data;
      if (typeof data === 'string') {
        const parsedResults = this.parser.parseText(data);
        if (parsedResults.length === 0) {
          result.errors.push('Failed to parse data');
          return result;
        }
        parsed = parsedResults[0]; // Take first parsed result
      }

      // Step 2: Validate data
      const validation = this.validator.validateBusiness(parsed);
      if (!validation.isValid) {
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      }

      result.validated = this.normalizeData(parsed);
      result.confidence = parsed.confidence || 50;

      // Step 3: Check for duplicates
      if (!options.skipDuplicateCheck) {
        const duplicateCheck = await this.checkDuplicate(result.validated);
        result.isDuplicate = duplicateCheck.isDuplicate;
        result.duplicateOf = duplicateCheck.duplicateId;

        if (result.isDuplicate) {
          result.warnings.push(`Duplicate of place ID: ${duplicateCheck.duplicateId}`);
        }
      }

      // Step 4: Enhance content
      if (!options.skipEnhancement && !result.isDuplicate) {
        result.enhanced = await this.enhanceContent(result.validated);
      }

      return result;
    } catch (error) {
      result.errors.push(`Pipeline error: ${(error as Error).message}`);
      return result;
    }
  }

  // Process multiple items in batch
  async processBatch(
    items: any[],
    options: {
      skipDuplicateCheck?: boolean;
      skipEnhancement?: boolean;
      concurrency?: number;
    } = {}
  ): Promise<PipelineResult[]> {
    const concurrency = options.concurrency || 5;
    const results: PipelineResult[] = [];
    
    // Process in chunks to avoid overwhelming the system
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(item => this.process(item, options))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  // Normalize data to our Place format
  private normalizeData(data: any): Place {
    return {
      name: this.cleanString(data.name),
      address: this.cleanString(data.address),

      category: data.category || 'general',
      location: this.parseLocation(data),
      photos: this.normalizeImages(data.images || data.photos)
      // First, check exact matches by name
      const { data: exactMatches } = await supabase
        .from('places')
        .select('id, name, address')
        .ilike('name', `%${place.name}%`)
        .limit(10);

      if (exactMatches && exactMatches.length > 0) {
        // Use duplicate detector for fuzzy matching
        const existingBusinesses = exactMatches.map(match => ({
          name: match.name,
          address: match.address || '',
          phone: '', // Not available in current schema
          email: '',
          website: '',
          city: '',
          category: '',
          rating: 0,
          priceRange: '',
          confidence: 100,
          dateAdded: new Date().toISOString()
        }));

        const newBusiness = {
          name: place.name || '',
          address: place.address || '',
          phone: '',
          email: '',
          website: '',
          city: '',
          category: place.category || '',
          rating: place.rating || 0,
          priceRange: '',
          confidence: 100,
          dateAdded: new Date().toISOString()
        };

        const duplicates = this.duplicateDetector.findDuplicatesAgainstExisting(
          newBusiness,
          existingBusinesses
        );

        if (duplicates.length > 0) {
          const duplicate = duplicates[0];
          const matchingPlace = exactMatches.find(p => p.name === duplicate.existingBusiness.name);
          
          return {
            isDuplicate: true,
            duplicateId: matchingPlace?.id,
            similarity: duplicate.similarity
          };
        }
      }

      // Check by coordinates if available
      if (place.location?.lat && place.location?.lng) {
        const { data: nearbyPlaces } = await supabase
          .from('places')
          .select('id, name, location')
          .not('location', 'is', null)
          .limit(20);

        if (nearbyPlaces && nearbyPlaces.length > 0) {
          // Check if any are within 50 meters and have similar names
          for (const nearby of nearbyPlaces) {
            if (nearby.location?.lat && nearby.location?.lng) {
              const distance = this.calculateDistance(
                place.location.lat,
                place.location.lng,
                nearby.location.lat,
                nearby.location.lng
              );

              if (distance < 0.05) { // 50 meters
                const nameSimilarity = this.calculateStringSimilarity(
                  place.name?.toLowerCase() || '',
                  nearby.name?.toLowerCase() || ''
                );

                if (nameSimilarity > 0.8) {
                  return {
                    isDuplicate: true,
                    duplicateId: nearby.id,
                    similarity: nameSimilarity
                  };
                }
              }
            }
          }
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Duplicate check error:', error);
      return { isDuplicate: false };
    }
  }

  // Enhance content using AI
  private async enhanceContent(place: Place): Promise<any> {
    try {
      // Create a venue object for the enhancer
      const venue = {
        id: 'temp',
        name: place.name,
        category: place.category,
        location: this.extractCityFromAddress(place.address),
        description: '',
        score: place.rating ? place.rating * 2 : 6, // Convert to 10-point scale
        images: place.photos || [],
        amenities: [],
        coordinates: place.location
      };

      // Use the ContentEnhancementEngine
      const enhanced = await this.enhancer.enhanceVenuesBatch([venue]);

      if (enhanced.length > 0) {
        const enhancedVenue = enhanced[0];
        return {
          seoData: enhancedVenue.seo,
          tags: enhancedVenue.tags,
          summaries: enhancedVenue.summaries,
          schemaMarkup: enhancedVenue.structured_data,
          contentScore: enhancedVenue.content_quality_score
        };
      }

      return null;
    } catch (error) {
      console.error('Enhancement error:', error);
      return null;
    }
  }

  // Parse location data
  private parseLocation(data: any): any {
    const lat = this.parseCoordinate(data.latitude || data.lat);
    const lng = this.parseCoordinate(data.longitude || data.lng || data.lon);
    
    if (lat !== undefined && lng !== undefined) {
      return { lat, lng };
    }
    
    return null;
  }

  // Helper methods for data normalization
  private cleanString(str: any): string | undefined {
    if (!str) return undefined;
    return String(str).trim().replace(/\s+/g, ' ');
  }

  private parseRating(rating: any): number | undefined {
    if (!rating) return undefined;
    
    const parsed = parseFloat(rating);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
      return Math.round(parsed * 10) / 10; // Round to 1 decimal
    }
    
    return undefined;
  }

  private normalizeLocation(data: any): { lat: number; lng: number } | undefined {
    let lat: number | undefined;
    let lng: number | undefined;

    // Try different coordinate field names
    if (data.latitude && data.longitude) {
      lat = parseFloat(data.latitude);
      lng = parseFloat(data.longitude);
    } else if (data.lat && data.lng) {
      lat = parseFloat(data.lat);
      lng = parseFloat(data.lng);
    } else if (data.location?.lat && data.location?.lng) {
      lat = parseFloat(data.location.lat);
      lng = parseFloat(data.location.lng);
    }

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      // Validate coordinates are within South Africa bounds
      if (lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33) {
        return { lat, lng };
      }
    }

    return undefined;
  }

  private normalizeCategory(category: any): string {
    if (!category) return 'general';
    
    const categoryMap: Record<string, string> = {
      'restaurant': 'restaurant',
      'hotel': 'hotel',
      'attraction': 'tourist_attraction',
      'activity': 'activity',
      'cafe': 'restaurant',
      'lodge': 'hotel',
      'museum': 'tourist_attraction',
      'tour': 'activity'
    };

    const normalized = String(category).toLowerCase();
    return categoryMap[normalized] || 'general';
  }

  private normalizeImages(images: any): string[] | undefined {
    if (!images) return undefined;
    
    const normalized: string[] = [];
    const imageArray = Array.isArray(images) ? images : [images];
    
    for (const image of imageArray) {
      if (typeof image === 'string' && image.trim()) {
        try {
          // Validate URL
          new URL(image);
          normalized.push(image.trim());
        } catch {
          // Skip invalid URLs
        }
      }
    }
    
    return normalized.length > 0 ? normalized : undefined;
  }

  private extractCityFromAddress(address?: string): string {
    if (!address) return 'South Africa';
    
    const cities = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Stellenbosch'];
    
    for (const city of cities) {
      if (address.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    
    return 'South Africa';
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}