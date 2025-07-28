import { BaseScraper } from '../base/BaseScraper';
import { ScraperResult, RestaurantData } from '../types';

export class RestaurantScraper extends BaseScraper {
  async scrape(url: string): Promise<ScraperResult> {
    try {
      const html = await this.fetchHtml(url);
      const $ = this.parseHtml(html);

      const data: RestaurantData = {
        name: this.cleanText($('h1.restaurant-name, h1.business-name, .name-header, h1').first().text()),
        address: this.cleanText($('.address, .location-address, [itemprop="address"]').first().text()),
        phone: this.extractPhone($),
        website: this.extractWebsite($, url),
        description: this.cleanText($('.description, .about-section, .overview, .restaurant-description').first().text()),
        cuisine: this.extractCuisine($),
        priceRange: this.extractPriceRange($('.price-range, .price-info, .pricing').text()),
        rating: this.extractRating($),
        images: this.extractImages($, '.gallery img, .photos img, .carousel img, .restaurant-images img', url),
        features: this.extractFeatures($),
        openingHours: this.extractOpeningHours($),
        coordinates: await this.extractCoordinates($)
      };

      return {
        success: true,
        data,
        url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        url,
        timestamp: new Date().toISOString()
      };
    }
  }

  async scrapeList(urls: string[]): Promise<ScraperResult[]> {
    const results = await Promise.all(
      urls.map(url => this.limit(() => this.scrape(url)))
    );
    
    return results;
  }

  private extractCuisine($: cheerio.CheerioAPI): string[] {
    const cuisines = new Set<string>();
    
    $('.cuisine-type, .food-type, [itemprop="servesCuisine"], .cuisine-tags span').each((_, element) => {
      const cuisine = $(element).text().trim();
      if (cuisine && cuisine.length < 30) {
        cuisines.add(cuisine);
      }
    });

    // Also check meta tags and structured data
    $('meta[name*="cuisine"], meta[property*="cuisine"]').each((_, element) => {
      const content = $(element).attr('content');
      if (content) {
        content.split(',').forEach(c => {
          const trimmed = c.trim();
          if (trimmed) cuisines.add(trimmed);
        });
      }
    });

    return Array.from(cuisines);
  }

  private extractFeatures($: cheerio.CheerioAPI): string[] {
    const features = new Set<string>();
    
    $('.amenities li, .features li, .highlights li, .restaurant-features li').each((_, element) => {
      const feature = $(element).text().trim();
      if (feature && feature.length < 50) {
        features.add(feature);
      }
    });

    // Check for common restaurant features
    const featureChecks = {
      'outdoor seating': $('.outdoor, .patio, .terrace').length > 0,
      'wifi': $('.wifi, .internet').length > 0 || $('*:contains("WiFi")').length > 0,
      'parking': $('.parking').length > 0 || $('*:contains("parking")').length > 0,
      'reservations': $('.reservation, .booking').length > 0 || $('*:contains("reservation")').length > 0,
      'takeaway': $('.takeaway, .takeout').length > 0 || $('*:contains("takeaway")').length > 0,
      'delivery': $('.delivery').length > 0 || $('*:contains("delivery")').length > 0
    };

    Object.entries(featureChecks).forEach(([feature, hasFeature]) => {
      if (hasFeature) {
        features.add(feature);
      }
    });

    return Array.from(features);
  }

  private extractOpeningHours($: cheerio.CheerioAPI): Record<string, string> | null {
    const hours: Record<string, string> = {};
    
    $('.hours-table tr, .opening-hours li, .hours-list li').each((_, element) => {
      const text = $(element).text();
      const dayMatch = text.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i);
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M|\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|Closed)/i);
      
      if (dayMatch && timeMatch) {
        const day = dayMatch[0].toLowerCase();
        hours[day] = timeMatch[0];
      }
    });

    // Try structured data
    $('[itemprop="openingHours"]').each((_, element) => {
      const content = $(element).attr('content') || $(element).text();
      if (content) {
        // Parse schema.org format like "Mo-Fr 09:00-17:00"
        const matches = content.matchAll(/([A-Za-z]{2}(?:-[A-Za-z]{2})?)\s+(\d{2}:\d{2}-\d{2}:\d{2})/g);
        for (const match of matches) {
          const [_, days, time] = match;
          if (days.includes('-')) {
            const [start, end] = days.split('-');
            hours[start.toLowerCase()] = time;
            hours[end.toLowerCase()] = time;
          } else {
            hours[days.toLowerCase()] = time;
          }
        }
      }
    });

    return Object.keys(hours).length > 0 ? hours : null;
  }

  private async extractCoordinates($: cheerio.CheerioAPI): Promise<{ lat: number; lng: number } | null> {
    // Try to extract from various sources
    const mapLink = $('a[href*="maps.google"], a[href*="google.com/maps"]').first().attr('href');
    
    if (mapLink) {
      const latLngMatch = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (latLngMatch) {
        return {
          lat: parseFloat(latLngMatch[1]),
          lng: parseFloat(latLngMatch[2])
        };
      }
    }

    // Try schema.org markup
    const latitude = $('[itemprop="latitude"]').attr('content');
    const longitude = $('[itemprop="longitude"]').attr('content');
    
    if (latitude && longitude) {
      return {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      };
    }

    // Try data attributes
    const lat = $('[data-lat]').attr('data-lat');
    const lng = $('[data-lng]').attr('data-lng');
    
    if (lat && lng) {
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }

    return null;
  }
}