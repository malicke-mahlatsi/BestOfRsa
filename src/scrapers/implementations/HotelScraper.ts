import { BaseScraper } from '../base/BaseScraper';
import { ScraperResult, HotelData } from '../types';

export class HotelScraper extends BaseScraper {
  async scrape(url: string): Promise<ScraperResult> {
    try {
      const html = await this.fetchHtml(url);
      const $ = this.parseHtml(html);

      const data: HotelData = {
        name: this.cleanText($('h1.hotel-name, h1.property-name, .hotel-title, h1').first().text()),
        address: this.cleanText($('.address, .hotel-address, [itemprop="address"]').first().text()),
        phone: this.extractPhone($),
        website: this.extractWebsite($, url),
        description: this.cleanText($('.description, .hotel-description, .overview, .about-hotel').first().text()),
        starRating: this.extractStarRating($),
        roomTypes: this.extractRoomTypes($),
        amenities: this.extractAmenities($),
        checkIn: this.extractCheckInOut($, 'checkin'),
        checkOut: this.extractCheckInOut($, 'checkout'),
        cancellationPolicy: this.cleanText($('.cancellation-policy, .policy, .booking-policy').first().text()),
        rating: this.extractRating($),
        images: this.extractImages($, '.gallery img, .photos img, .hotel-images img, .room-images img', url),
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

  private extractStarRating($: cheerio.CheerioAPI): number | undefined {
    // Look for star rating indicators
    const starSelectors = [
      '.star-rating',
      '.hotel-stars',
      '[itemprop="starRating"]',
      '.stars'
    ];

    for (const selector of starSelectors) {
      const element = $(selector).first();
      
      // Try to get from text content
      const text = element.text().trim();
      const starMatch = text.match(/(\d+)\s*star/i);
      if (starMatch) {
        const stars = parseInt(starMatch[1]);
        if (stars >= 1 && stars <= 5) {
          return stars;
        }
      }

      // Try to count star elements
      const starCount = element.find('.star, .fa-star').length;
      if (starCount >= 1 && starCount <= 5) {
        return starCount;
      }

      // Try data attributes
      const dataStars = element.attr('data-stars') || element.attr('data-rating');
      if (dataStars) {
        const stars = parseInt(dataStars);
        if (stars >= 1 && stars <= 5) {
          return stars;
        }
      }
    }

    return undefined;
  }

  private extractRoomTypes($: cheerio.CheerioAPI): Array<{ type: string; price: number; amenities: string[] }> {
    const roomTypes: Array<{ type: string; price: number; amenities: string[] }> = [];

    $('.room-type, .accommodation-type, .room-card').each((_, element) => {
      const roomElement = $(element);
      
      const type = this.cleanText(roomElement.find('.room-name, .type-name, h3, h4').first().text());
      const priceText = roomElement.find('.price, .rate, .cost').first().text();
      const price = this.extractPriceFromText(priceText);
      
      const amenities: string[] = [];
      roomElement.find('.amenities li, .features li, .room-features li').each((_, amenityEl) => {
        const amenity = $(amenityEl).text().trim();
        if (amenity) {
          amenities.push(amenity);
        }
      });

      if (type && price > 0) {
        roomTypes.push({ type, price, amenities });
      }
    });

    return roomTypes;
  }

  private extractAmenities($: cheerio.CheerioAPI): string[] {
    const amenities = new Set<string>();
    
    $('.amenities li, .facilities li, .hotel-amenities li, .services li').each((_, element) => {
      const amenity = $(element).text().trim();
      if (amenity && amenity.length < 50) {
        amenities.add(amenity);
      }
    });

    // Check for common hotel amenities
    const amenityChecks = {
      'WiFi': $('.wifi, .internet').length > 0 || $('*:contains("WiFi")').length > 0,
      'Pool': $('.pool, .swimming').length > 0 || $('*:contains("pool")').length > 0,
      'Gym': $('.gym, .fitness').length > 0 || $('*:contains("gym")').length > 0,
      'Spa': $('.spa, .wellness').length > 0 || $('*:contains("spa")').length > 0,
      'Restaurant': $('.restaurant, .dining').length > 0 || $('*:contains("restaurant")').length > 0,
      'Bar': $('.bar, .lounge').length > 0 || $('*:contains("bar")').length > 0,
      'Parking': $('.parking').length > 0 || $('*:contains("parking")').length > 0,
      'Room Service': $('*:contains("room service")').length > 0,
      'Concierge': $('*:contains("concierge")').length > 0,
      'Business Center': $('*:contains("business center")').length > 0
    };

    Object.entries(amenityChecks).forEach(([amenity, hasAmenity]) => {
      if (hasAmenity) {
        amenities.add(amenity);
      }
    });

    return Array.from(amenities);
  }

  private extractCheckInOut($: cheerio.CheerioAPI, type: 'checkin' | 'checkout'): string | undefined {
    const selectors = [
      `.${type}, .${type}-time`,
      `[itemprop="${type}Time"]`,
      `.check-${type === 'checkin' ? 'in' : 'out'}`
    ];

    for (const selector of selectors) {
      const timeText = $(selector).first().text().trim();
      const timeMatch = timeText.match(/(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
      if (timeMatch) {
        return timeMatch[1];
      }
    }

    // Look in policy or info sections
    const policyText = $('.policy, .check-in-policy, .hotel-policy').text();
    const pattern = type === 'checkin' 
      ? /check.?in.*?(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i
      : /check.?out.*?(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i;
    
    const match = policyText.match(pattern);
    return match ? match[1] : undefined;
  }

  private extractPriceFromText(text: string): number {
    const priceMatch = text.match(/(?:R|ZAR)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    return 0;
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

    return null;
  }
}