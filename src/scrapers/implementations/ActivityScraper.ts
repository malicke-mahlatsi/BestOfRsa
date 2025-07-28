import { BaseScraper } from '../base/BaseScraper';
import { ScraperResult, ActivityData } from '../types';

export class ActivityScraper extends BaseScraper {
  async scrape(url: string): Promise<ScraperResult> {
    try {
      const html = await this.fetchHtml(url);
      const $ = this.parseHtml(html);

      const data: ActivityData = {
        name: this.cleanText($('h1.activity-name, h1.tour-name, .activity-title, h1').first().text()),
        address: this.cleanText($('.address, .location, .meeting-point, [itemprop="address"]').first().text()),
        phone: this.extractPhone($),
        website: this.extractWebsite($, url),
        description: this.cleanText($('.description, .activity-description, .overview, .about-activity').first().text()),
        duration: this.extractDuration($),
        groupSize: this.extractGroupSize($),
        difficulty: this.extractDifficulty($),
        ageRestriction: this.extractAgeRestriction($),
        included: this.extractIncluded($),
        requirements: this.extractRequirements($),
        bestTime: this.extractBestTime($),
        rating: this.extractRating($),
        images: this.extractImages($, '.gallery img, .photos img, .activity-images img, .tour-images img', url),
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

  private extractDuration($: cheerio.CheerioAPI): string | undefined {
    const durationSelectors = [
      '.duration',
      '.activity-duration',
      '.tour-duration',
      '.time-required'
    ];

    for (const selector of durationSelectors) {
      const text = this.cleanText($(selector).first().text());
      if (text && text.length < 50) {
        return text;
      }
    }

    // Look for duration patterns in content
    const content = $('.description, .overview, .details').text();
    const durationPatterns = [
      /(\d+(?:-\d+)?\s*(?:hours?|hrs?|days?|minutes?|mins?))/i,
      /(half\s+day|full\s+day|whole\s+day|multi-day)/i
    ];

    for (const pattern of durationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return this.cleanText(match[1]);
      }
    }

    return undefined;
  }

  private extractGroupSize($: cheerio.CheerioAPI): string | undefined {
    const groupSizeSelectors = [
      '.group-size',
      '.max-participants',
      '.capacity',
      '.participants'
    ];

    for (const selector of groupSizeSelectors) {
      const text = this.cleanText($(selector).first().text());
      if (text && text.length < 50) {
        return text;
      }
    }

    // Look for group size patterns
    const content = $('.description, .overview, .booking-info').text();
    const groupPatterns = [
      /(up to \d+ (?:people|persons|participants))/i,
      /(\d+(?:-\d+)? (?:people|persons|participants))/i,
      /(small group|large group|private group)/i
    ];

    for (const pattern of groupPatterns) {
      const match = content.match(pattern);
      if (match) {
        return this.cleanText(match[1]);
      }
    }

    return undefined;
  }

  private extractDifficulty($: cheerio.CheerioAPI): 'Easy' | 'Moderate' | 'Challenging' | 'Expert' | undefined {
    const difficultySelectors = [
      '.difficulty',
      '.activity-level',
      '.fitness-level',
      '.skill-level'
    ];

    for (const selector of difficultySelectors) {
      const text = $(selector).first().text().toLowerCase();
      
      if (text.includes('easy') || text.includes('beginner')) return 'Easy';
      if (text.includes('moderate') || text.includes('intermediate')) return 'Moderate';
      if (text.includes('challenging') || text.includes('difficult') || text.includes('advanced')) return 'Challenging';
      if (text.includes('expert') || text.includes('extreme')) return 'Expert';
    }

    // Look in description
    const description = $('.description, .overview').text().toLowerCase();
    if (description.includes('easy') || description.includes('beginner')) return 'Easy';
    if (description.includes('moderate') || description.includes('intermediate')) return 'Moderate';
    if (description.includes('challenging') || description.includes('difficult')) return 'Challenging';
    if (description.includes('expert') || description.includes('extreme')) return 'Expert';

    return undefined;
  }

  private extractAgeRestriction($: cheerio.CheerioAPI): string | undefined {
    const ageSelectors = [
      '.age-restriction',
      '.minimum-age',
      '.age-limit',
      '.age-requirement'
    ];

    for (const selector of ageSelectors) {
      const text = this.cleanText($(selector).first().text());
      if (text && text.length < 50) {
        return text;
      }
    }

    // Look for age patterns
    const content = $('.description, .overview, .booking-info').text();
    const agePatterns = [
      /(minimum age \d+)/i,
      /(ages? \d+\+?)/i,
      /(children under \d+)/i,
      /(all ages)/i,
      /(\d+ years and older)/i
    ];

    for (const pattern of agePatterns) {
      const match = content.match(pattern);
      if (match) {
        return this.cleanText(match[1]);
      }
    }

    return undefined;
  }

  private extractIncluded($: cheerio.CheerioAPI): string[] {
    const included = new Set<string>();
    
    $('.included li, .whats-included li, .package-includes li').each((_, element) => {
      const item = $(element).text().trim();
      if (item && item.length < 100) {
        included.add(item);
      }
    });

    // Look for inclusion indicators
    $('.inclusions, .includes').find('li, p').each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length < 100 && !text.toLowerCase().includes('not included')) {
        included.add(text);
      }
    });

    return Array.from(included);
  }

  private extractRequirements($: cheerio.CheerioAPI): string[] {
    const requirements = new Set<string>();
    
    $('.requirements li, .what-to-bring li, .bring-items li').each((_, element) => {
      const item = $(element).text().trim();
      if (item && item.length < 100) {
        requirements.add(item);
      }
    });

    // Look for requirement patterns
    const content = $('.description, .overview, .booking-info').text();
    const reqPatterns = [
      /(?:bring|required?|need|must have)[^.]*(?:shoes|clothing|equipment|gear)[^.]*/gi,
      /(?:comfortable|suitable)[^.]*(?:clothing|shoes|footwear)[^.]*/gi
    ];

    for (const pattern of reqPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = this.cleanText(match);
          if (cleaned.length < 100) {
            requirements.add(cleaned);
          }
        });
      }
    }

    return Array.from(requirements);
  }

  private extractBestTime($: cheerio.CheerioAPI): string | undefined {
    const bestTimeSelectors = [
      '.best-time',
      '.recommended-time',
      '.optimal-time',
      '.season'
    ];

    for (const selector of bestTimeSelectors) {
      const text = this.cleanText($(selector).first().text());
      if (text && text.length < 100) {
        return text;
      }
    }

    // Look for time patterns in description
    const description = $('.description, .overview').text();
    const timePatterns = [
      /best time[^.]*\.?/i,
      /recommended (?:time|season)[^.]*\.?/i,
      /(?:morning|afternoon|evening|sunset|sunrise)[^.]*\.?/i
    ];

    for (const pattern of timePatterns) {
      const match = description.match(pattern);
      if (match) {
        return this.cleanText(match[0]);
      }
    }

    return undefined;
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