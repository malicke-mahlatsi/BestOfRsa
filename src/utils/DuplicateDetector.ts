import { ParsedBusiness } from './PerplexityDataParser';

export interface DuplicateMatch {
  business: ParsedBusiness;
  existingBusiness: ParsedBusiness;
  similarity: number;
  matchReasons: string[];
}

export class DuplicateDetector {
  private readonly SIMILARITY_THRESHOLD = 0.8;
  private readonly PHONE_WEIGHT = 0.4;
  private readonly NAME_WEIGHT = 0.3;
  private readonly ADDRESS_WEIGHT = 0.3;

  /**
   * Find potential duplicates in a list of businesses
   */
  public findDuplicatesInList(businesses: ParsedBusiness[]): DuplicateMatch[] {
    const duplicates: DuplicateMatch[] = [];
    
    for (let i = 0; i < businesses.length; i++) {
      for (let j = i + 1; j < businesses.length; j++) {
        const similarity = this.calculateSimilarity(businesses[i], businesses[j]);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          const matchReasons = this.getMatchReasons(businesses[i], businesses[j]);
          duplicates.push({
            business: businesses[i],
            existingBusiness: businesses[j],
            similarity,
            matchReasons
          });
        }
      }
    }
    
    return duplicates;
  }

  /**
   * Check if a business is a duplicate of any in the existing list
   */
  public findDuplicatesAgainstExisting(
    newBusiness: ParsedBusiness, 
    existingBusinesses: ParsedBusiness[]
  ): DuplicateMatch[] {
    const duplicates: DuplicateMatch[] = [];
    
    for (const existing of existingBusinesses) {
      const similarity = this.calculateSimilarity(newBusiness, existing);
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        const matchReasons = this.getMatchReasons(newBusiness, existing);
        duplicates.push({
          business: newBusiness,
          existingBusiness: existing,
          similarity,
          matchReasons
        });
      }
    }
    
    return duplicates;
  }

  /**
   * Calculate similarity score between two businesses
   */
  private calculateSimilarity(business1: ParsedBusiness, business2: ParsedBusiness): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Phone number comparison (exact match)
    if (business1.phone && business2.phone) {
      const phoneScore = this.normalizePhone(business1.phone) === this.normalizePhone(business2.phone) ? 1 : 0;
      totalScore += phoneScore * this.PHONE_WEIGHT;
      totalWeight += this.PHONE_WEIGHT;
    }

    // Name comparison (fuzzy match)
    if (business1.name && business2.name) {
      const nameScore = this.calculateStringSimilarity(
        this.normalizeName(business1.name),
        this.normalizeName(business2.name)
      );
      totalScore += nameScore * this.NAME_WEIGHT;
      totalWeight += this.NAME_WEIGHT;
    }

    // Address comparison (fuzzy match)
    if (business1.address && business2.address) {
      const addressScore = this.calculateStringSimilarity(
        this.normalizeAddress(business1.address),
        this.normalizeAddress(business2.address)
      );
      totalScore += addressScore * this.ADDRESS_WEIGHT;
      totalWeight += this.ADDRESS_WEIGHT;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Get reasons why two businesses might be duplicates
   */
  private getMatchReasons(business1: ParsedBusiness, business2: ParsedBusiness): string[] {
    const reasons: string[] = [];

    // Check phone match
    if (business1.phone && business2.phone && 
        this.normalizePhone(business1.phone) === this.normalizePhone(business2.phone)) {
      reasons.push('Same phone number');
    }

    // Check email match
    if (business1.email && business2.email && 
        business1.email.toLowerCase() === business2.email.toLowerCase()) {
      reasons.push('Same email address');
    }

    // Check name similarity
    if (business1.name && business2.name) {
      const nameSimilarity = this.calculateStringSimilarity(
        this.normalizeName(business1.name),
        this.normalizeName(business2.name)
      );
      if (nameSimilarity > 0.8) {
        reasons.push('Very similar business name');
      }
    }

    // Check address similarity
    if (business1.address && business2.address) {
      const addressSimilarity = this.calculateStringSimilarity(
        this.normalizeAddress(business1.address),
        this.normalizeAddress(business2.address)
      );
      if (addressSimilarity > 0.8) {
        reasons.push('Very similar address');
      }
    }

    // Check website match
    if (business1.website && business2.website && 
        this.normalizeWebsite(business1.website) === this.normalizeWebsite(business2.website)) {
      reasons.push('Same website');
    }

    return reasons;
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/[\s\-\(\)]/g, '');
    if (normalized.startsWith('0')) {
      normalized = '+27' + normalized.substring(1);
    }
    return normalized;
  }

  /**
   * Normalize business name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\b(the|and|&|restaurant|hotel|cafe|bar|spa|ltd|pty|cc)\b/g, '') // Remove common words
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Normalize address for comparison
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/\b(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|close|crescent|cres)\b/g, 'st')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize website URL for comparison
   */
  private normalizeWebsite(website: string): string {
    try {
      const url = new URL(website.startsWith('http') ? website : 'https://' + website);
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    }
  }

  /**
   * Calculate string similarity using Jaro-Winkler algorithm
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Use a simplified version of Jaro similarity
    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;

    // Apply Winkler prefix bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + (0.1 * prefix * (1 - jaro));
  }

  /**
   * Remove duplicates from a list, keeping the one with highest confidence
   */
  public removeDuplicates(businesses: ParsedBusiness[]): ParsedBusiness[] {
    const duplicateGroups = this.groupDuplicates(businesses);
    const unique: ParsedBusiness[] = [];

    for (const group of duplicateGroups) {
      // Keep the business with the highest confidence score
      const best = group.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );
      unique.push(best);
    }

    return unique;
  }

  /**
   * Group businesses that are duplicates of each other
   */
  private groupDuplicates(businesses: ParsedBusiness[]): ParsedBusiness[][] {
    const groups: ParsedBusiness[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < businesses.length; i++) {
      if (processed.has(i)) continue;

      const group = [businesses[i]];
      processed.add(i);

      for (let j = i + 1; j < businesses.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.calculateSimilarity(businesses[i], businesses[j]);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          group.push(businesses[j]);
          processed.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }
}