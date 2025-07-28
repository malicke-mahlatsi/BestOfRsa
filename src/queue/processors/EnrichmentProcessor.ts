import { QueueJob } from '../QueueManager';
import { supabase } from '../../lib/supabase';

export class EnrichmentProcessor {
  async process(job: QueueJob): Promise<any> {
    const { placeId, enrichmentType } = job.data;

    // Get place data
    const { data: place, error: fetchError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (fetchError || !place) {
      throw new Error(`Place not found: ${placeId}`);
    }

    let enrichedData: any = {};

    switch (enrichmentType) {
      case 'seo':
        enrichedData = await this.generateSEOData(place);
        break;
      case 'images':
        enrichedData = await this.enhanceImages(place);
        break;
      case 'reviews':
        enrichedData = await this.collectReviews(place);
        break;
      case 'coordinates':
        enrichedData = await this.geocodeAddress(place);
        break;
      default:
        enrichedData = await this.fullEnrichment(place);
    }

    // Update place with enriched data
    const { data: updated, error: updateError } = await supabase
      .from('places')
      .update(enrichedData)
      .eq('id', placeId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updated;
  }

  private async generateSEOData(place: any): Promise<any> {
    // Generate SEO-friendly title and description
    const title = `${place.name} - ${place.category} in ${place.address?.split(',').pop()?.trim() || 'South Africa'}`;
    const description = `Discover ${place.name}, ${place.description?.substring(0, 100) || 'a premier destination'} in South Africa. View photos, reviews, and contact information.`;

    return {
      seo_title: title.substring(0, 60),
      seo_description: description.substring(0, 160),
      slug: this.generateSlug(place.name)
    };
  }

  private async enhanceImages(place: any): Promise<any> {
    // Enhance image data with alt text, captions, etc.
    const enhancedPhotos = (place.photos || []).map((photo: string, index: number) => ({
      url: photo,
      alt: `${place.name} - Image ${index + 1}`,
      caption: `View of ${place.name}`,
      order: index
    }));

    return {
      photos: enhancedPhotos
    };
  }

  private async collectReviews(place: any): Promise<any> {
    // Placeholder for review collection logic
    // This would integrate with review APIs or scraping
    return {
      review_count: 0,
      average_rating: place.rating || 0
    };
  }

  private async geocodeAddress(place: any): Promise<any> {
    if (!place.address || place.location) {
      return {}; // Already has coordinates or no address
    }

    try {
      // Use a geocoding service to get coordinates
      // This is a placeholder - you'd integrate with Google Maps API or similar
      const mockCoordinates = {
        lat: -33.9249 + (Math.random() - 0.5) * 0.1,
        lng: 18.4241 + (Math.random() - 0.5) * 0.1
      };

      return {
        location: mockCoordinates
      };
    } catch (error) {
      console.error('Geocoding failed:', error);
      return {};
    }
  }

  private async fullEnrichment(place: any): Promise<any> {
    // Combine all enrichment types
    const seoData = await this.generateSEOData(place);
    const imageData = await this.enhanceImages(place);
    const reviewData = await this.collectReviews(place);
    const coordinateData = await this.geocodeAddress(place);

    return {
      ...seoData,
      ...imageData,
      ...reviewData,
      ...coordinateData,
      enriched_at: new Date().toISOString()
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}