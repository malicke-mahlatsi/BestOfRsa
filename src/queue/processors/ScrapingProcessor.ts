import { QueueJob } from '../QueueManager';
import { supabase } from '../../lib/supabase';

export class ScrapingProcessor {

  async process(job: QueueJob): Promise<any> {
    const { url, category, enrichment } = job.data;

    // Simulate scraping result for now
    const result = {
      success: true,
      data: {
        name: `Sample ${category} from ${url}`,
        address: 'Sample Address, Cape Town',
        phone: '+27 21 123 4567',
        website: url,
        description: `A sample ${category} scraped from ${url}`,
        rating: Math.random() * 5,
        images: [`https://images.pexels.com/photos/1000000/pexels-photo-1000000.jpeg`],
        coordinates: {
          lat: -33.9249 + (Math.random() - 0.5) * 0.1,
          lng: 18.4241 + (Math.random() - 0.5) * 0.1
        }
      }
    };

    // Transform scraped data to match database schema
    const place = {
      name: result.data.name,
      address: result.data.address,
      phone: result.data.phone,
      website: result.data.website,
      category: this.getCategoryName(category),
      rating: result.data.rating || 0,
      location: result.data.coordinates ? {
        lat: result.data.coordinates.lat,
        lng: result.data.coordinates.lng
      } : null,
      photos: result.data.images || [],
    };

    // Save to database
    const { data: inserted, error } = await supabase
      .from('places')
      .insert(place)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If enrichment is requested, add enrichment job
    if (enrichment && inserted) {
      // This would trigger an enrichment job
      // queueManager.addJob('enrich', { placeId: inserted.id }, { priority: 3 });
    }

    return inserted;
  }

  private getCategoryName(category: string): string {
    const map: Record<string, string> = {
      restaurant: 'restaurant',
      hotel: 'hotel',
      attraction: 'tourist_attraction',
      activity: 'activity'
    };
    return map[category] || 'general';
  }
}