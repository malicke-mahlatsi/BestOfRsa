import * as cheerio from 'cheerio';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import pLimit from 'p-limit';
import { ScraperConfig, ScrapedData, ScraperResult } from '../types';

export abstract class BaseScraper {
  protected axiosInstance: AxiosInstance;
  protected config: ScraperConfig;
  protected limit: any;
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();

  constructor(config: ScraperConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      requestsPerSecond: 2,
      timeout: 30000,
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ],
      ...config
    };

    // Initialize axios with retry logic
    this.axiosInstance = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache'
      }
    });

    axiosRetry(this.axiosInstance, {
      retries: this.config.maxRetries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status === 429 ||
               error.response?.status >= 500;
      }
    });

    // Initialize concurrency limiter
    this.limit = pLimit(this.config.requestsPerSecond);
  }

  // Rate limiting implementation
  protected async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 1000 / this.config.requestsPerSecond;

    if (timeSinceLastRequest < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Get random user agent
  protected getRandomUserAgent(): string {
    return this.config.userAgents![Math.floor(Math.random() * this.config.userAgents!.length)];
  }

  // Fetch HTML content
  protected async fetchHtml(url: string): Promise<string> {
    await this.throttle();

    try {
      const response = await this.axiosInstance.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent()
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, (error as Error).message);
      throw error;
    }
  }

  // Parse HTML with Cheerio
  protected parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  // Extract images with validation
  protected extractImages($: cheerio.CheerioAPI, selector: string, baseUrl?: string): string[] {
    const images: string[] = [];
    
    $(selector).each((_, element) => {
      let src = $(element).attr('src') || $(element).attr('data-src');
      if (src) {
        // Handle relative URLs
        if (baseUrl && !src.startsWith('http')) {
          src = new URL(src, baseUrl).href;
        }
        
        // Validate image URL
        if (this.isValidImageUrl(src)) {
          images.push(src);
        }
      }
    });

    return [...new Set(images)]; // Remove duplicates
  }

  // Validate image URL
  private isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      return validExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext));
    } catch {
      return false;
    }
  }

  // Clean text helper
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();
  }

  // Extract price range
  protected extractPriceRange(text: string): string | null {
    const pricePatterns = {
      '$': /(?:R|ZAR)?\s*0*[1-9]\d{0,2}(?:\s*-\s*R?\s*0*[1-9]\d{0,2})?/,
      '$$': /(?:R|ZAR)?\s*[1-9]\d{2,3}(?:\s*-\s*R?\s*[1-9]\d{2,3})?/,
      '$$$': /(?:R|ZAR)?\s*[1-9]\d{3,4}(?:\s*-\s*R?\s*[1-9]\d{3,4})?/,
      '$$$$': /(?:R|ZAR)?\s*[1-9]\d{4,}(?:\s*-\s*R?\s*[1-9]\d{4,})?/
    };

    for (const [range, pattern] of Object.entries(pricePatterns)) {
      if (pattern.test(text)) {
        return range;
      }
    }

    return null;
  }

  // Extract phone number
  protected extractPhone($: cheerio.CheerioAPI): string | null {
    const phoneSelectors = [
      'a[href^="tel:"]',
      '.phone-number',
      '.contact-phone',
      '[itemprop="telephone"]',
      '.phone',
      '.tel'
    ];

    for (const selector of phoneSelectors) {
      const phoneElement = $(selector).first();
      let phone = phoneElement.attr('href') || phoneElement.text();
      
      if (phone) {
        // Clean phone number
        phone = phone.replace(/^tel:/, '').replace(/\D/g, '');
        
        // Validate South African phone numbers
        if (phone.length >= 10) {
          // Add country code if missing
          if (phone.startsWith('0')) {
            phone = '27' + phone.substring(1);
          }
          return phone;
        }
      }
    }

    return null;
  }

  // Extract website
  protected extractWebsite($: cheerio.CheerioAPI, currentUrl: string): string | null {
    const websiteSelectors = [
      'a[href*="website"]',
      'a:contains("Website")',
      '.website-link',
      '.official-website',
      '[itemprop="url"]'
    ];

    for (const selector of websiteSelectors) {
      const websiteLink = $(selector).first().attr('href');
      
      if (websiteLink && websiteLink !== currentUrl) {
        if (!websiteLink.startsWith('http')) {
          return new URL(websiteLink, currentUrl).href;
        }
        return websiteLink;
      }
    }

    return null;
  }

  // Extract rating
  protected extractRating($: cheerio.CheerioAPI): number | null {
    const ratingSelectors = [
      '.rating-value',
      '.star-rating',
      '[itemprop="ratingValue"]',
      '.score',
      '.rating'
    ];

    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text().trim();
      const rating = parseFloat(ratingText);
      
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        return rating;
      }
    }

    return null;
  }

  // Abstract methods to be implemented by specific scrapers
  abstract scrape(url: string): Promise<ScraperResult>;
  abstract scrapeList(urls: string[]): Promise<ScraperResult[]>;
}