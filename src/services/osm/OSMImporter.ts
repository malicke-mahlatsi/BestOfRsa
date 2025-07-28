import { OSMDataService } from './OSMDataService';
import { supabase } from '../../lib/supabase';
import { Place } from '../../types/database';

export class OSMImporter {
  private osmService: OSMDataService;
  private cities = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth'];
  private categories = ['restaurants', 'hotels', 'attractions', 'activities'] as const;

  constructor() {
    this.osmService = new OSMDataService();
  }

  // Import all data for all cities and categories
  async importAll(): Promise<void> {
    console.log('Starting OSM data import for South Africa...');
    
    for (const city of this.cities) {
      console.log(`\nImporting data for ${city}...`);
      
      for (const category of this.categories) {
        console.log(`  Fetching ${category}...`);
        
        try {
          const places = await this.osmService.fetchCityPOIs(city, category);
          
          if (places.length > 0) {
            const result = await this.bulkInsertPlaces(places);
            console.log(`    Imported ${result.inserted_count} ${category} (${result.duplicate_count} duplicates)`);
          } else {
            console.log(`    No ${category} found`);
          }
          
          // Delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`    Error importing ${category}:`, (error as Error).message);
        }
      }
    }
    
    console.log('\nOSM import completed!');
  }

  // Import specific category for a city
  async importCityCategory(city: string, category: keyof typeof this.osmService['categoryMappings']): Promise<{ inserted_count: number; duplicate_count: number }> {
    console.log(`Importing ${category} for ${city}...`);
    
    const places = await this.osmService.fetchCityPOIs(city, category);
    
    if (places.length === 0) {
      console.log(`No ${category} found for ${city}`);
      return { inserted_count: 0, duplicate_count: 0 };
    }
    
    const result = await this.bulkInsertPlaces(places);
    console.log(`Imported ${result.inserted_count} ${category} (${result.duplicate_count} duplicates)`);
    
    return result;
  }

  // Search and import specific places
  async searchAndImport(query: string, city: string): Promise<{ inserted_count: number; duplicate_count: number }> {
    console.log(`Searching for "${query}" in ${city}...`);
    
    const places = await this.osmService.searchPlaces(query, city);
    
    if (places.length === 0) {
      console.log(`No results found for "${query}" in ${city}`);
      return { inserted_count: 0, duplicate_count: 0 };
    }
    
    const result = await this.bulkInsertPlaces(places);
    console.log(`Imported ${result.inserted_count} places (${result.duplicate_count} duplicates)`);
    
    return result;
  }

  // Bulk insert with duplicate detection
  private async bulkInsertPlaces(places: Place[]): Promise<{ inserted_count: number; duplicate_count: number }> {
    // Prepare data for bulk insert
    const placesData = places.map(place => ({
      name: place.name,
      address: place.address,
      website: place.website,
      location: place.location,
      category: place.category,
      rating: place.rating,
      photos: place.photos || [],
    }));

    // Call the bulk insert function
    const { data, error } = await supabase
      .rpc('bulk_insert_places', { places_data: placesData });

    if (error) {
      throw error;
    }

    return data[0] || { inserted_count: 0, duplicate_count: 0 };
  }

  // Get available cities
  getCities(): string[] {
    return [...this.cities];
  }

  // Get available categories
  getCategories(): string[] {
    return [...this.categories];
  }
}