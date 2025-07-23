export interface ParsedBusiness {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  category: string;
  rating: number;
  priceRange: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
  dateAdded: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PerplexityDataParser {
  private readonly phoneRegex = /(\+27|0)[\d\s\-\(\)]{8,15}/g;
  private readonly emailRegex = /[\w\.\-]+@[\w\.\-]+\.\w{2,}/g;
  private readonly websiteRegex = /(?:https?:\/\/)?(?:www\.)?[\w\-]+\.[\w\-\.]+(?:\/[\w\-\.\/]*)?/g;
  private readonly priceRegex = /R\s*\d+(?:\s*-\s*R?\s*\d+)?|R{1,2}\d+/g;
  private readonly ratingRegex = /(\d+(?:\.\d+)?)\s*(?:\/\s*5|stars?|rating)/gi;
  
  // South African cities and common address patterns
  private readonly saCities = [
    'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 
    'Bloemfontein', 'Stellenbosch', 'Sandton', 'Camps Bay', 'Waterfront',
    'Rosebank', 'Melville', 'Observatory', 'Woodstock', 'Green Point'
  ];

  private readonly addressPatterns = [
    /\d+\s+[\w\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Close|Crescent|Cres)[\w\s,]*(?:Cape Town|Johannesburg|Durban|Pretoria|Sandton|Stellenbosch)/gi,
    /[\w\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr)[\w\s,]*,\s*(?:Cape Town|Johannesburg|Durban|Pretoria)/gi,
    /(?:Shop|Unit)\s*\d+[\w\s,]*(?:Mall|Centre|Center|Plaza)[\w\s,]*(?:Cape Town|Johannesburg|Durban|Pretoria)/gi
  ];

  private readonly categoryKeywords = {
    restaurant: ['restaurant', 'dining', 'cuisine', 'food', 'eatery', 'bistro', 'cafe', 'grill', 'kitchen', 'steakhouse', 'pizzeria'],
    hotel: ['hotel', 'lodge', 'resort', 'accommodation', 'guesthouse', 'inn', 'boutique hotel', 'luxury hotel'],
    attraction: ['attraction', 'museum', 'gallery', 'park', 'monument', 'landmark', 'tour', 'experience', 'activity'],
    bar: ['bar', 'pub', 'lounge', 'cocktail', 'brewery', 'wine bar', 'sports bar'],
    spa: ['spa', 'wellness', 'massage', 'beauty', 'salon', 'treatment'],
    shopping: ['shop', 'store', 'boutique', 'mall', 'market', 'retail']
  };

  /**
   * Main parsing function that processes Perplexity AI text
   */
  public parseText(text: string): ParsedBusiness[] {
    const businesses: ParsedBusiness[] = [];
    
    // Split text into potential business entries
    const entries = this.splitIntoEntries(text);
    
    for (const entry of entries) {
      const parsed = this.parseBusinessEntry(entry);
      if (parsed && this.validateBusiness(parsed).isValid) {
        businesses.push(parsed);
      }
    }

    return this.removeDuplicates(businesses);
  }

  /**
   * Split text into individual business entries
   */
  private splitIntoEntries(text: string): string[] {
    // Common patterns that indicate new business entries
    const separators = [
      /\n\d+\.\s+/g,  // Numbered lists
      /\n-\s+/g,      // Bullet points
      /\n\*\s+/g,     // Asterisk bullets
      /\n#{1,3}\s+/g, // Markdown headers
      /\n[A-Z][^.!?]*(?:\n|$)/g // Lines starting with capital letters
    ];

    let entries = [text];
    
    for (const separator of separators) {
      const newEntries: string[] = [];
      for (const entry of entries) {
        const split = entry.split(separator).filter(e => e.trim().length > 50);
        newEntries.push(...split);
      }
      if (newEntries.length > entries.length) {
        entries = newEntries;
        break;
      }
    }

    return entries.filter(entry => entry.trim().length > 30);
  }

  /**
   * Parse individual business entry
   */
  private parseBusinessEntry(text: string): ParsedBusiness | null {
    const name = this.extractBusinessName(text);
    if (!name) return null;

    const phone = this.extractPhone(text);
    const email = this.extractEmail(text);
    const website = this.extractWebsite(text);
    const address = this.extractAddress(text);
    const city = this.extractCity(text);
    const category = this.categorizeText(text);
    const rating = this.extractRating(text);
    const priceRange = this.extractPriceRange(text);
    const description = this.extractDescription(text, name);

    // Calculate confidence score
    const confidence = this.calculateConfidence({
      name, phone, email, website, address, city, category, rating, description
    });

    return {
      name,
      description,
      phone,
      email,
      website,
      address,
      city,
      category,
      rating,
      priceRange,
      confidence,
      dateAdded: new Date().toISOString()
    };
  }

  /**
   * Extract business name from text
   */
  private extractBusinessName(text: string): string {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for patterns that indicate business names
    const namePatterns = [
      /^[A-Z][^.!?]*(?:Restaurant|Hotel|Lodge|Cafe|Bar|Spa|Gallery|Museum)/i,
      /^[A-Z][A-Za-z\s&'-]{2,50}(?=\s*[-–—]|\s*\n|\s*:)/,
      /^[A-Z][A-Za-z\s&'-]{2,50}$/
    ];

    for (const line of lines.slice(0, 3)) {
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match) {
          return this.cleanBusinessName(match[0]);
        }
      }
    }

    // Fallback: use first substantial line
    const firstLine = lines.find(line => line.length > 3 && line.length < 100);
    return firstLine ? this.cleanBusinessName(firstLine) : '';
  }

  /**
   * Clean and format business name
   */
  private cleanBusinessName(name: string): string {
    return name
      .replace(/^[\d\.\-\*\s]+/, '') // Remove leading numbers/bullets
      .replace(/[:\-–—].*$/, '') // Remove everything after colon or dash
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Extract phone number
   */
  private extractPhone(text: string): string {
    const matches = text.match(this.phoneRegex);
    if (!matches) return '';
    
    // Clean and format phone number
    let phone = matches[0].replace(/[\s\-\(\)]/g, '');
    if (phone.startsWith('0')) {
      phone = '+27' + phone.substring(1);
    }
    return phone;
  }

  /**
   * Extract email address
   */
  private extractEmail(text: string): string {
    const matches = text.match(this.emailRegex);
    return matches ? matches[0].toLowerCase() : '';
  }

  /**
   * Extract website URL
   */
  private extractWebsite(text: string): string {
    const matches = text.match(this.websiteRegex);
    if (!matches) return '';
    
    let website = matches[0];
    if (!website.startsWith('http')) {
      website = 'https://' + website;
    }
    return website;
  }

  /**
   * Extract address using multiple patterns
   */
  private extractAddress(text: string): string {
    for (const pattern of this.addressPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        return this.cleanAddress(matches[0]);
      }
    }

    // Fallback: look for lines containing street indicators and city names
    const lines = text.split('\n');
    for (const line of lines) {
      if (this.containsAddressIndicators(line) && this.containsCity(line)) {
        return this.cleanAddress(line);
      }
    }

    return '';
  }

  /**
   * Check if line contains address indicators
   */
  private containsAddressIndicators(line: string): boolean {
    const indicators = ['street', 'st', 'road', 'rd', 'avenue', 'ave', 'drive', 'dr', 'mall', 'centre', 'center'];
    return indicators.some(indicator => 
      line.toLowerCase().includes(indicator)
    );
  }

  /**
   * Check if line contains a South African city
   */
  private containsCity(line: string): boolean {
    return this.saCities.some(city => 
      line.toLowerCase().includes(city.toLowerCase())
    );
  }

  /**
   * Extract city from address or text
   */
  private extractCity(text: string): string {
    for (const city of this.saCities) {
      if (text.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    return '';
  }

  /**
   * Clean address string
   */
  private cleanAddress(address: string): string {
    return address
      .replace(/^[^\w]*/, '') // Remove leading non-word characters
      .replace(/[,\s]+$/, '') // Remove trailing commas and spaces
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Extract rating from text
   */
  private extractRating(text: string): number {
    const matches = text.match(this.ratingRegex);
    if (matches) {
      const rating = parseFloat(matches[1]);
      return rating <= 5 ? rating : rating / 10; // Handle 10-point scales
    }
    return 0;
  }

  /**
   * Extract price range
   */
  private extractPriceRange(text: string): string {
    const matches = text.match(this.priceRegex);
    return matches ? matches[0] : '';
  }

  /**
   * Extract description from text
   */
  private extractDescription(text: string, businessName: string): string {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Find lines that don't contain contact info or the business name
    const descriptionLines = lines.filter(line => 
      !line.includes(businessName) &&
      !this.phoneRegex.test(line) &&
      !this.emailRegex.test(line) &&
      !this.websiteRegex.test(line) &&
      line.length > 20 &&
      line.length < 300
    );

    return descriptionLines.slice(0, 2).join(' ').trim();
  }

  /**
   * Categorize business based on keywords
   */
  private categorizeText(text: string): string {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
        return acc + count;
      }, 0);
      
      if (score > 0) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Calculate confidence score for parsed data
   */
  private calculateConfidence(business: Partial<ParsedBusiness>): number {
    let score = 0;
    
    if (business.name && business.name.length > 2) score += 20;
    if (business.phone) score += 15;
    if (business.email) score += 15;
    if (business.website) score += 10;
    if (business.address) score += 20;
    if (business.city) score += 10;
    if (business.description && business.description.length > 20) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Validate parsed business data
   */
  public validateBusiness(business: ParsedBusiness): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!business.name || business.name.length < 2) {
      errors.push('Business name is required and must be at least 2 characters');
    }

    if (!business.category) {
      errors.push('Category is required');
    }

    // Phone validation
    if (business.phone && !this.isValidSAPhone(business.phone)) {
      warnings.push('Phone number format may be incorrect');
    }

    // Email validation
    if (business.email && !this.isValidEmail(business.email)) {
      warnings.push('Email format may be incorrect');
    }

    // Website validation
    if (business.website && !this.isValidWebsite(business.website)) {
      warnings.push('Website URL format may be incorrect');
    }

    // Confidence threshold
    if (business.confidence < 50) {
      warnings.push('Low confidence score - manual review recommended');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate South African phone number
   */
  private isValidSAPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+27|0)[1-9]\d{8}$/.test(cleanPhone);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate website URL
   */
  private isValidWebsite(website: string): boolean {
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove duplicate businesses
   */
  public removeDuplicates(businesses: ParsedBusiness[]): ParsedBusiness[] {
    const seen = new Set<string>();
    const unique: ParsedBusiness[] = [];

    for (const business of businesses) {
      const key = this.generateDuplicateKey(business);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(business);
      }
    }

    return unique;
  }

  /**
   * Generate key for duplicate detection
   */
  private generateDuplicateKey(business: ParsedBusiness): string {
    const name = business.name.toLowerCase().replace(/[^\w]/g, '');
    const phone = business.phone.replace(/[^\d]/g, '');
    const address = business.address.toLowerCase().replace(/[^\w]/g, '');
    
    return `${name}-${phone}-${address}`;
  }

  /**
   * Check for potential duplicates against existing data
   */
  public findPotentialDuplicates(newBusiness: ParsedBusiness, existingBusinesses: ParsedBusiness[]): ParsedBusiness[] {
    const duplicates: ParsedBusiness[] = [];
    
    for (const existing of existingBusinesses) {
      const similarity = this.calculateSimilarity(newBusiness, existing);
      if (similarity > 0.8) {
        duplicates.push(existing);
      }
    }
    
    return duplicates;
  }

  /**
   * Calculate similarity between two businesses
   */
  private calculateSimilarity(business1: ParsedBusiness, business2: ParsedBusiness): number {
    let score = 0;
    let factors = 0;

    // Name similarity
    if (business1.name && business2.name) {
      score += this.stringSimilarity(business1.name, business2.name) * 0.4;
      factors += 0.4;
    }

    // Phone similarity
    if (business1.phone && business2.phone) {
      score += (business1.phone === business2.phone ? 1 : 0) * 0.3;
      factors += 0.3;
    }

    // Address similarity
    if (business1.address && business2.address) {
      score += this.stringSimilarity(business1.address, business2.address) * 0.3;
      factors += 0.3;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
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