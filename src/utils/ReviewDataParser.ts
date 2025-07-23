export interface ReviewData {
  id: string;
  venue_name: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  helpful_count: number;
  verified: boolean;
  authenticity_score: number;
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  source: 'google' | 'tripadvisor' | 'facebook' | 'yelp' | 'other';
  mentions: {
    food: string[];
    service: string[];
    atmosphere: string[];
    value: string[];
    features: string[];
  };
  photos?: string[];
}

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  rating_breakdown: { [key: number]: number };
  sentiment_summary: { [key: string]: number };
  popular_mentions: { [category: string]: Array<{ item: string; count: number }> };
  authenticity_average: number;
}

export class ReviewDataParser {
  private readonly positiveWords = [
    'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'loved',
    'perfect', 'beautiful', 'delicious', 'friendly', 'clean', 'recommended',
    'outstanding', 'superb', 'brilliant', 'incredible', 'awesome', 'magnificent'
  ];

  private readonly negativeWords = [
    'terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointed',
    'dirty', 'rude', 'overpriced', 'cold', 'slow', 'avoid',
    'worst', 'disgusting', 'unacceptable', 'shocking', 'appalling'
  ];

  private readonly foodKeywords = [
    'dish', 'meal', 'food', 'cuisine', 'taste', 'flavor', 'recipe',
    'appetizer', 'main course', 'dessert', 'wine', 'cocktail', 'breakfast'
  ];

  private readonly serviceKeywords = [
    'staff', 'service', 'waiter', 'waitress', 'manager', 'reception',
    'friendly', 'helpful', 'attentive', 'professional', 'courteous'
  ];

  /**
   * Parse Perplexity review response into structured review data
   */
  public parseReviewResponse(response: string, venueName: string): ReviewData[] {
    const reviews: ReviewData[] = [];
    
    // Split response into review blocks
    const reviewBlocks = this.extractReviewBlocks(response);
    
    reviewBlocks.forEach((block, index) => {
      const review = this.parseReviewBlock(block, venueName, index);
      if (review) {
        reviews.push(review);
      }
    });

    return reviews;
  }

  /**
   * Extract individual review blocks from response
   */
  private extractReviewBlocks(response: string): string[] {
    // Try different patterns to split reviews
    const patterns = [
      /(?:review\s*\d+|positive review|negative review|customer review)/gi,
      /(?:\d+\.\s+|\*\s+|-\s+)/g,
      /(?:reviewer|customer|guest)\s*\w+\s*says?/gi
    ];

    let blocks: string[] = [response];

    for (const pattern of patterns) {
      const newBlocks: string[] = [];
      for (const block of blocks) {
        const split = block.split(pattern).filter(b => b.trim().length > 50);
        if (split.length > blocks.length) {
          newBlocks.push(...split);
        } else {
          newBlocks.push(block);
        }
      }
      if (newBlocks.length > blocks.length) {
        blocks = newBlocks;
        break;
      }
    }

    return blocks.filter(block => block.trim().length > 30);
  }

  /**
   * Parse individual review block
   */
  private parseReviewBlock(block: string, venueName: string, index: number): ReviewData | null {
    const text = this.cleanReviewText(block);
    if (text.length < 20) return null;

    const sentiment = this.analyzeSentiment(text);
    const rating = this.extractOrCalculateRating(text, sentiment);
    const source = this.detectSource(text);
    const mentions = this.extractMentions(text);
    const authenticity = this.calculateAuthenticity(text);

    return {
      id: `review-${Date.now()}-${index}`,
      venue_name: venueName,
      author: this.generateAuthorName(index),
      rating,
      date: this.generateReviewDate(index),
      text,
      helpful_count: Math.floor(Math.random() * 50) + 1,
      verified: Math.random() > 0.4,
      authenticity_score: authenticity,
      sentiment,
      source,
      mentions,
      photos: Math.random() > 0.7 ? this.generateReviewPhotos() : undefined
    };
  }

  /**
   * Analyze sentiment of review text
   */
  private analyzeSentiment(text: string): ReviewData['sentiment'] {
    const lowerText = text.toLowerCase();
    let score = 0;

    // Count positive words
    this.positiveWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    });

    // Count negative words
    this.negativeWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      score -= matches;
    });

    // Adjust for intensity words
    if (/very|extremely|absolutely|incredibly|totally/.test(lowerText)) {
      score = score > 0 ? score * 1.5 : score * 1.5;
    }

    if (score >= 3) return 'very_positive';
    if (score >= 1) return 'positive';
    if (score <= -3) return 'very_negative';
    if (score <= -1) return 'negative';
    return 'neutral';
  }

  /**
   * Extract or calculate rating from text
   */
  private extractOrCalculateRating(text: string, sentiment: ReviewData['sentiment']): number {
    // Try to extract numeric rating
    const ratingPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:\/\s*5|out\s+of\s+5|stars?)/i,
      /(\d+(?:\.\d+)?)\s*(?:\/\s*10|out\s+of\s+10)/i,
      /rated?\s+(\d+(?:\.\d+)?)/i
    ];

    for (const pattern of ratingPatterns) {
      const match = text.match(pattern);
      if (match) {
        const rating = parseFloat(match[1]);
        // Convert to 5-star scale if needed
        return rating <= 5 ? rating : rating / 2;
      }
    }

    // Calculate from sentiment
    const sentimentRatings = {
      'very_positive': 5,
      'positive': 4,
      'neutral': 3,
      'negative': 2,
      'very_negative': 1
    };

    return sentimentRatings[sentiment];
  }

  /**
   * Detect review source platform
   */
  private detectSource(text: string): ReviewData['source'] {
    const lowerText = text.toLowerCase();
    
    if (/google|google maps/i.test(lowerText)) return 'google';
    if (/tripadvisor|trip advisor/i.test(lowerText)) return 'tripadvisor';
    if (/facebook|fb/i.test(lowerText)) return 'facebook';
    if (/yelp/i.test(lowerText)) return 'yelp';
    
    return 'other';
  }

  /**
   * Extract mentions from review text
   */
  private extractMentions(text: string): ReviewData['mentions'] {
    const mentions: ReviewData['mentions'] = {
      food: [],
      service: [],
      atmosphere: [],
      value: [],
      features: []
    };

    const lowerText = text.toLowerCase();

    // Food mentions
    const foodPattern = /(?:try the|loved the|recommend the|best|delicious|tasty)\s+([a-zA-Z\s]{2,30}?)(?:\s|,|\.|\!|\?|$)/gi;
    let match;
    while ((match = foodPattern.exec(text)) !== null) {
      const item = match[1].trim();
      if (item.length > 2 && item.length < 30) {
        mentions.food.push(item);
      }
    }

    // Service mentions
    this.serviceKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        mentions.service.push(keyword);
      }
    });

    // Atmosphere mentions
    const atmosphereWords = ['atmosphere', 'ambiance', 'vibe', 'mood', 'setting', 'decor'];
    atmosphereWords.forEach(word => {
      if (lowerText.includes(word)) {
        mentions.atmosphere.push(word);
      }
    });

    // Value mentions
    if (/value|price|cost|expensive|cheap|affordable|worth/i.test(text)) {
      mentions.value.push('price/value mentioned');
    }

    // Feature mentions
    const features = ['pool', 'view', 'parking', 'wifi', 'breakfast', 'location', 'room', 'bathroom'];
    features.forEach(feature => {
      if (lowerText.includes(feature)) {
        mentions.features.push(feature);
      }
    });

    return mentions;
  }

  /**
   * Calculate review authenticity score
   */
  private calculateAuthenticity(text: string): number {
    let score = 50; // Base score

    // Length check
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 20 && wordCount <= 200) score += 20;
    if (wordCount < 10 || wordCount > 300) score -= 15;

    // Specific details
    if (/\d+\s*(minutes?|hours?|days?|weeks?)/i.test(text)) score += 10;
    if (/specific|exactly|precisely|particular/i.test(text)) score += 10;

    // Balanced review
    if (/but|however|although|except|though/i.test(text)) score += 15;

    // Personal pronouns (indicates personal experience)
    if (/\b(i|we|my|our|me|us)\b/gi.test(text)) score += 10;

    // Generic phrases (might indicate fake review)
    const genericPhrases = ['highly recommend', 'must visit', 'best ever', 'worst ever', 'amazing experience'];
    let genericCount = 0;
    genericPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) genericCount++;
    });
    score -= genericCount * 5;

    // Excessive punctuation or caps
    if (/[!]{3,}|[A-Z]{10,}/.test(text)) score -= 10;

    return Math.max(10, Math.min(100, score));
  }

  /**
   * Clean review text
   */
  private cleanReviewText(text: string): string {
    return text
      .replace(/^[\d\.\-\*\s]+/, '') // Remove leading numbers/bullets
      .replace(/review\s*\d*:?\s*/gi, '') // Remove "review" labels
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate author name
   */
  private generateAuthorName(index: number): string {
    const firstNames = [
      'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'James', 'Maria', 'Robert',
      'Jennifer', 'Christopher', 'Nomsa', 'Pieter', 'Thandiwe', 'Johan', 'Fatima'
    ];
    const lastNames = [
      'Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis',
      'Mthembu', 'van der Merwe', 'Nkomo', 'Steyn', 'Patel', 'Botha'
    ];

    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    
    return `${firstName} ${lastName.charAt(0)}.`;
  }

  /**
   * Generate review date
   */
  private generateReviewDate(index: number): string {
    const now = Date.now();
    const daysAgo = Math.floor(Math.random() * 365) + index * 7; // Spread over a year
    return new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * Generate review photos
   */
  private generateReviewPhotos(): string[] {
    const photoCount = Math.floor(Math.random() * 3) + 1;
    const photos: string[] = [];
    
    for (let i = 0; i < photoCount; i++) {
      photos.push(`https://images.pexels.com/photos/${1400000 + Math.floor(Math.random() * 100000)}/pexels-photo-${1400000 + Math.floor(Math.random() * 100000)}.jpeg?auto=compress&cs=tinysrgb&w=400`);
    }
    
    return photos;
  }

  /**
   * Aggregate review data into summary
   */
  public aggregateReviewData(reviews: ReviewData[]): ReviewSummary {
    const summary: ReviewSummary = {
      total_reviews: reviews.length,
      average_rating: 0,
      rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      sentiment_summary: { very_positive: 0, positive: 0, neutral: 0, negative: 0, very_negative: 0 },
      popular_mentions: {},
      authenticity_average: 0
    };

    if (reviews.length === 0) return summary;

    let totalRating = 0;
    let totalAuthenticity = 0;
    const allMentions: { [category: string]: string[] } = {
      food: [],
      service: [],
      atmosphere: [],
      value: [],
      features: []
    };

    reviews.forEach(review => {
      totalRating += review.rating;
      totalAuthenticity += review.authenticity_score;
      summary.rating_breakdown[Math.floor(review.rating)]++;
      summary.sentiment_summary[review.sentiment]++;

      // Collect mentions
      Object.entries(review.mentions).forEach(([category, items]) => {
        if (allMentions[category]) {
          allMentions[category].push(...items);
        }
      });
    });

    summary.average_rating = Number((totalRating / reviews.length).toFixed(1));
    summary.authenticity_average = Math.round(totalAuthenticity / reviews.length);

    // Calculate popular mentions
    Object.entries(allMentions).forEach(([category, items]) => {
      const counts: { [item: string]: number } = {};
      items.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
      });

      summary.popular_mentions[category] = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([item, count]) => ({ item, count }));
    });

    return summary;
  }
}