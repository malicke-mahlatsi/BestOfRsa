import { QueueJob } from '../QueueManager';
import { RestaurantScraper } from '../../scrapers/implementations/RestaurantScraper';
import { HotelScraper } from '../../scrapers/implementations/HotelScraper';
import { AttractionScraper } from '../../scrapers/implementations/AttractionScraper';
import { ActivityScraper } from '../../scrapers/implementations/ActivityScraper';
import { supabase } from '../../lib/supabase';

export class ScrapingProcessor {
  private scrapers = {
    restaurant: new RestaurantScraper({ requestsPerSecond: 1 }),
    hotel: new HotelScraper({ requestsPerSecond: 1 }),
    attraction: new AttractionScraper({ requestsPerSecond: 1 }),
    activity: new ActivityScraper({ requestsPerSecond: 1 })
  };

  async process(job: QueueJob): Promise<any> {
    const { url, category, enrichment } = job.data;

    // Select appropriate scraper
    const scraper = this.scrapers[category as keyof typeof this.scrapers];
    if (!scraper) {
      throw new Error(`No scraper available for category: ${category}`);
    }

    // Scrape the URL
    const result = await scraper.scrape(url);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Transform scraped data to match database schema
    const place = {
      name: result.data?.name,
      address: result.data?.address,
      phone: result.data?.phone,
      website: result.data?.website,
      description: result.data?.description,
      category: this.getCategoryName(category),
      rating: result.data?.rating || 0,
      location: result.data?.coordinates ? {
        lat: result.data.coordinates.lat,
        lng: result.data.coordinates.lng
      } : null,
      photos: result.data?.images || [],
      source_type: 'scrape',
      source_url: url,
      scraped_at: new Date().toISOString(),
      is_active: true,
      is_verified: false
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