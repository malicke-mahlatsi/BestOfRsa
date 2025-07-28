import { BaseScraper } from '../base/BaseScraper';
import { ScraperResult, AttractionData } from '../types';

export class AttractionScraper extends BaseScraper {
  async scrape(url: string): Promise<ScraperResult> {
    try {
      const html = await this.fetchHtml(url);
      const $ = this.parseHtml(html);

      const data: AttractionData = {
        name: this.cleanText($('h1.attraction-name, h1.site-name, .attraction-title, h1').first().text()),
        address: this.cleanText($('.address, .location, [itemprop="address"]').first().text()),
        phone: this.extractPhone($),
        website: this.extractWebsite($, url),
        description: this.cleanText($('.description, .attraction-description, .overview, .about').first().text()),
        ticketPrices: this.extractTicketPrices($),
        openingHours: this.extractOpeningHours($),
        bestTimeToVisit: this.extractBestTime($),
        duration: this.extractDuration($),
        accessibility: this.extractAccessibility($),
        facilities: this.extractFacilities($),
        rating: this.extractRating($),
        images: this.extractImages($, '.gallery img, .photos img, .attraction-images img, .slideshow img', url),
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

  private extractTicketPrices($: cheerio.CheerioAPI): Array<{ type: string; price: number; description?: string }> {
    const prices: Array<{ type: string; price: number; description?: string }> = [];

    $('.ticket-price, .admission-price, .price-table tr').each((_, element) => {
      const priceElement = $(element);
      
      const type = this.cleanText(priceElement.find('.ticket-type, .price-type, td:first-child').first().text());
      const priceText = priceElement.find('.price, .cost, .amount, td:last-child').first().text();
      const description = this.cleanText(priceElement.find('.description, .details').first().text());
      
      const price = this.extractPriceFromText(priceText);
      
      if (type && price > 0) {
        prices.push({ type, price, description: description || undefined });
      }
    });

    // Also check for simple price listings
    $('.pricing li, .admission-fees li').each((_, element) => {
      const text = $(element).text();
      const match = text.match(/(.+?):\s*(?:R|ZAR)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        const type = this.cleanText(match[1]);
        const price = parseFloat(match[2].replace(/,/g, ''));
        prices.push({ type, price });
      }
    });

    return prices;
  }

  private extractOpeningHours($: cheerio.CheerioAPI): Record<string, string> | null {
    const hours: Record<string, string> = {};
    
    $('.opening-hours li, .hours-table tr, .operating-hours li').each((_, element) => {
      const text = $(element).text();
      const dayMatch = text.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i);
      const timeMatch = text.match(/(\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M|\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}|Closed)/i);
      
      if (dayMatch && timeMatch) {
        const day = dayMatch[0].toLowerCase();
        hours[day] = timeMatch[0];
      }
    });

    return Object.keys(hours).length > 0 ? hours : null;
  }

  private extractBestTime($: cheerio.CheerioAPI): string | undefined {
    const bestTimeSelectors = [
      '.best-time',
      '.recommended-time',
      '.visit-time',
      '.optimal-time'
    ];

    for (const selector of bestTimeSelectors) {
      const text = this.cleanText($(selector).first().text());
      if (text && text.length < 100) {
        return text;
      }
    }

    // Look for patterns in description
    const description = $('.description, .overview').text();
    const timePatterns = [
      /best time to visit[^.]*\.?/i,
      /recommended time[^.]*\.?/i,
      /visit during[^.]*\.?/i
    ];

    for (const pattern of timePatterns) {
      const match = description.match(pattern);
      if (match) {
        return this.cleanText(match[0]);
      }
    }

    return undefined;
  }

  private extractDuration($: cheerio.CheerioAPI): string | undefined {
    const durationSelectors = [
      '.duration',
      '.visit-duration',
      '.time-needed',
      '.estimated-time'
    ];

    for (const selector of durationSelectors) {
      const text = this.cleanText($(selector).first().text());
      if (text && text.length < 50) {
        return text;
      }
    }

    // Look for duration patterns
    const content = $('.description, .overview, .details').text();
    const durationPatterns = [
      /(\d+(?:-\d+)?\s*(?:hours?|hrs?|minutes?|mins?))/i,
      /(half\s+day|full\s+day|whole\s+day)/i
    ];

    for (const pattern of durationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return this.cleanText(match[1]);
      }
    }

    return undefined;
  }

  private extractAccessibility($: cheerio.CheerioAPI): string[] {
    const accessibility = new Set<string>();
    
    $('.accessibility li, .access-features li, .disabled-access li').each((_, element) => {
      const feature = $(element).text().trim();
      if (feature && feature.length < 50) {
        accessibility.add(feature);
      }
    });

    // Check for common accessibility features
    const accessChecks = {
      'Wheelchair Accessible': $('.wheelchair, .disabled-access').length > 0 || $('*:contains("wheelchair")').length > 0,
      'Audio Guides': $('*:contains("audio guide")').length > 0,
      'Braille Signage': $('*:contains("braille")').length > 0,
      'Accessible Parking': $('*:contains("accessible parking")').length > 0,
      'Elevator Access': $('*:contains("elevator")').length > 0 || $('*:contains("lift")').length > 0
    };

    Object.entries(accessChecks).forEach(([feature, hasFeature]) => {
      if (hasFeature) {
        accessibility.add(feature);
      }
    });

    return Array.from(accessibility);
  }

  private extractFacilities($: cheerio.CheerioAPI): string[] {
    const facilities = new Set<string>();
    
    $('.facilities li, .amenities li, .services li').each((_, element) => {
      const facility = $(element).text().trim();
      if (facility && facility.length < 50) {
        facilities.add(facility);
      }
    });

    // Check for common attraction facilities
    const facilityChecks = {
      'Gift Shop': $('.gift-shop, .souvenir').length > 0 || $('*:contains("gift shop")').length > 0,
      'Cafe': $('.cafe, .restaurant').length > 0 || $('*:contains("cafe")').length > 0,
      'Restrooms': $('.restroom, .toilet').length > 0 || $('*:contains("restroom")').length > 0,
      'Parking': $('.parking').length > 0 || $('*:contains("parking")').length > 0,
      'Information Center': $('*:contains("information center")').length > 0,
      'Guided Tours': $('*:contains("guided tour")').length > 0
    };

    Object.entries(facilityChecks).forEach(([facility, hasFacility]) => {
      if (hasFacility) {
        facilities.add(facility);
      }
    });

    return Array.from(facilities);
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