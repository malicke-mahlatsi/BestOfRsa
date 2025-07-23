export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  og_image: string;
  og_title: string;
  og_description: string;
  twitter_card: string;
  schema_markup: object;
}

export interface ContentSummaries {
  short: string;    // 160 chars for meta description
  medium: string;   // 300 chars for card display
  long: string;     // 500 chars for detail page
}

export interface EnhancedVenue {
  id: string;
  name: string;
  category: string;
  location: string;
  seo: SEOMetadata;
  tags: string[];
  summaries: ContentSummaries;
  structured_data: object;
  content_quality_score: number;
  last_enhanced: string;
  slug: string;
  search_keywords: string[];
  related_venues: string[];
}

export class ContentEnhancementEngine {
  private readonly seoTemplates = {
    restaurant: {
      title: (venue: any) => `${venue.name} - ${venue.restaurant_data?.cuisines?.[0] || 'Restaurant'} in ${venue.location} | BestOfRSA`,
      description: (venue: any) => `Discover ${venue.name}, ${this.getArticle(venue.restaurant_data?.cuisines?.[0] || 'exceptional')} ${venue.restaurant_data?.cuisines?.[0] || 'dining'} restaurant in ${venue.location}. ${venue.price_range} pricing, ${venue.score}/10 rating. View menu, reviews, and opening hours.`,
      keywords: (venue: any) => [
        venue.name,
        `${venue.restaurant_data?.cuisines?.[0] || 'restaurant'} ${venue.location}`,
        `best restaurants ${venue.location}`,
        'South Africa dining',
        venue.location.toLowerCase(),
        ...this.extractKeywords(venue.description)
      ]
    },
    hotel: {
      title: (venue: any) => `${venue.name} ${venue.hotel_data?.star_rating ? venue.hotel_data.star_rating + ' Star' : ''} - Hotels in ${venue.location} | BestOfRSA`,
      description: (venue: any) => `Book your stay at ${venue.name} in ${venue.location}. ${venue.hotel_data?.star_rating ? venue.hotel_data.star_rating + '-star' : 'Premium'} accommodation with ${venue.amenities?.slice(0, 3).join(', ')}. From R${venue.hotel_data?.room_types?.[0]?.price || 'X'}/night.`,
      keywords: (venue: any) => [
        venue.name,
        `${venue.hotel_data?.star_rating || ''} star hotel ${venue.location}`,
        `hotels in ${venue.location}`,
        'South Africa accommodation',
        ...(venue.amenities || [])
      ]
    },
    attraction: {
      title: (venue: any) => `${venue.name} - Top Attractions in ${venue.location} | BestOfRSA`,
      description: (venue: any) => `Visit ${venue.name}, one of ${venue.location}'s must-see attractions. ${venue.attraction_data?.best_time_to_visit || 'Experience'} open ${venue.operating_hours?.Mon || 'daily'}. Plan your visit with reviews, photos, and insider tips.`,
      keywords: (venue: any) => [
        venue.name,
        `${venue.subcategory || 'attractions'} ${venue.location}`,
        `things to do ${venue.location}`,
        'South Africa tourism',
        'tourist attractions'
      ]
    },
    activity: {
      title: (venue: any) => `${venue.name} - ${venue.activity_data?.duration || 'Adventure'} in ${venue.location} | BestOfRSA`,
      description: (venue: any) => `Experience ${venue.name} in ${venue.location}. ${venue.activity_data?.duration || 'Full day'} ${venue.activity_data?.difficulty || 'adventure'} for ${venue.activity_data?.age_restriction || 'all ages'}. ${venue.score}/10 rating with professional guides.`,
      keywords: (venue: any) => [
        venue.name,
        `${venue.subcategory || 'activities'} ${venue.location}`,
        `adventure ${venue.location}`,
        'South Africa activities',
        'things to do'
      ]
    }
  };

  /**
   * Generate comprehensive SEO metadata
   */
  public generateSEOMetadata(venue: any): SEOMetadata {
    const category = venue.category.replace('places-to-', '').replace('things-to-', 'activity');
    const template = this.seoTemplates[category as keyof typeof this.seoTemplates] || this.seoTemplates.attraction;
    
    const title = template.title(venue);
    const description = template.description(venue);
    const keywords = template.keywords(venue);
    
    return {
      title: this.truncateText(title, 60),
      description: this.truncateText(description, 160),
      keywords,
      canonical: `https://bestofrsa.com/${venue.category}/${this.generateSlug(venue.name)}`,
      og_image: venue.images?.[0] || this.getDefaultImage(category),
      og_title: title,
      og_description: description,
      twitter_card: 'summary_large_image',
      schema_markup: this.generateStructuredData(venue)
    };
  }

  /**
   * Generate automatic tags
   */
  public generateTags(venue: any): string[] {
    const tags = new Set<string>();
    
    // Location tags
    tags.add(venue.location);
    tags.add(`${venue.location} ${venue.category.replace('-', ' ')}`);
    tags.add('South Africa');
    
    // Category-specific tags
    if (venue.category === 'places-to-eat') {
      if (venue.restaurant_data?.cuisines) {
        venue.restaurant_data.cuisines.forEach((cuisine: string) => tags.add(cuisine));
      }
      if (venue.restaurant_data?.dietary_options) {
        venue.restaurant_data.dietary_options.forEach((option: string) => tags.add(option));
      }
      // Price tags
      const priceMap: Record<string, string> = { '$': 'budget', '$$': 'moderate', '$$$': 'upscale', '$$$$': 'luxury' };
      if (venue.price_range) tags.add(priceMap[venue.price_range] || 'dining');
    }
    
    if (venue.category === 'places-to-stay') {
      if (venue.hotel_data?.star_rating) tags.add(`${venue.hotel_data.star_rating} star`);
      if (venue.hotel_data?.hotel_amenities) {
        venue.hotel_data.hotel_amenities.slice(0, 5).forEach((amenity: string) => tags.add(amenity.toLowerCase()));
      }
    }

    if (venue.category === 'things-to-do') {
      if (venue.activity_data?.difficulty) tags.add(venue.activity_data.difficulty.toLowerCase());
      if (venue.activity_data?.duration) tags.add('day trip');
      tags.add('adventure');
    }

    if (venue.category === 'places-to-visit') {
      tags.add('tourist attraction');
      tags.add('sightseeing');
      if (venue.attraction_data?.guided_tours_available) tags.add('guided tours');
    }
    
    // Quality tags
    if (venue.score >= 8) tags.add('highly rated');
    if (venue.score >= 9) tags.add('exceptional');
    if (venue.featured) tags.add('featured');
    
    // Subcategory tags
    if (venue.subcategory) tags.add(venue.subcategory.toLowerCase());
    
    // Extract from description
    const descriptionTags = this.extractKeywords(venue.description);
    descriptionTags.forEach(tag => tags.add(tag));
    
    return Array.from(tags).slice(0, 15); // Limit to 15 most relevant tags
  }

  /**
   * Generate content summaries
   */
  public generateSummaries(venue: any, reviews: any[] = []): ContentSummaries {
    const summaries: ContentSummaries = {
      short: '',
      medium: '',
      long: ''
    };
    
    // Short summary (meta description length)
    summaries.short = `${venue.name} is ${this.getArticle(venue.subcategory)} ${venue.subcategory} in ${venue.location} rated ${venue.score}/10. ${venue.highlights?.[0] || this.getHighlight(venue)}`;
    
    // Medium summary
    const topFeatures = venue.amenities?.slice(0, 3).join(', ') || 'Premium features';
    summaries.medium = `${summaries.short} Features include ${topFeatures}. ${this.getReviewHighlight(reviews)} Located in ${venue.address || venue.location}.`;
    
    // Long summary
    summaries.long = `${summaries.medium} ${venue.description || this.generateDescription(venue)} Perfect for ${this.getIdealFor(venue)}. ${this.getPriceInfo(venue)}`;
    
    // Truncate to exact lengths
    summaries.short = this.truncateText(summaries.short, 160);
    summaries.medium = this.truncateText(summaries.medium, 300);
    summaries.long = this.truncateText(summaries.long, 500);
    
    return summaries;
  }

  /**
   * Generate Schema.org structured data
   */
  public generateStructuredData(venue: any): object {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": this.getSchemaType(venue.category),
      "name": venue.name,
      "image": venue.images || [],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": venue.address,
        "addressLocality": venue.location,
        "addressCountry": "ZA"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": venue.coordinates?.lat,
        "longitude": venue.coordinates?.lng
      },
      "url": `https://bestofrsa.com/${venue.category}/${this.generateSlug(venue.name)}`,
      "telephone": venue.contact?.phone,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": venue.score,
        "bestRating": "10",
        "worstRating": "0",
        "ratingCount": venue.reviews?.length || 0
      }
    };
    
    // Category-specific additions
    if (venue.category === 'places-to-eat') {
      Object.assign(baseSchema, {
        "servesCuisine": venue.restaurant_data?.cuisines,
        "priceRange": venue.price_range,
        "openingHoursSpecification": this.convertToSchemaHours(venue.operating_hours),
        "acceptsReservations": venue.restaurant_data?.reservations_required ? "True" : "False"
      });
    }
    
    if (venue.category === 'places-to-stay') {
      Object.assign(baseSchema, {
        "@type": "Hotel",
        "starRating": {
          "@type": "Rating",
          "ratingValue": venue.hotel_data?.star_rating
        },
        "amenityFeature": venue.hotel_data?.hotel_amenities?.map((amenity: string) => ({
          "@type": "LocationFeatureSpecification",
          "name": amenity
        }))
      });
    }
    
    return baseSchema;
  }

  /**
   * Calculate content quality score
   */
  public calculateContentQuality(venue: any): number {
    let score = 0;
    const maxScore = 100;
    
    // Basic information (30 points)
    if (venue.name) score += 5;
    if (venue.address) score += 5;
    if (venue.contact?.phone) score += 5;
    if (venue.contact?.email) score += 3;
    if (venue.contact?.website) score += 3;
    if (venue.description?.length > 100) score += 5;
    if (venue.coordinates) score += 4;
    
    // Images (20 points)
    if (venue.images?.length >= 1) score += 5;
    if (venue.images?.length >= 4) score += 10;
    if (venue.images?.length >= 8) score += 5;
    
    // Reviews (20 points)
    if (venue.reviews?.length > 0) score += 5;
    if (venue.reviews?.length >= 5) score += 10;
    if (venue.reviews?.length >= 10) score += 5;
    
    // Category specific (15 points)
    if (venue.category === 'places-to-eat' && venue.restaurant_data?.cuisines) score += 5;
    if (venue.category === 'places-to-stay' && venue.hotel_data?.star_rating) score += 5;
    if (venue.operating_hours) score += 5;
    if (venue.amenities?.length >= 3) score += 5;
    
    // SEO readiness (15 points)
    if (venue.slug) score += 5;
    if (venue.tags?.length >= 5) score += 5;
    if (venue.seo?.description) score += 5;
    
    return Math.min(score, maxScore);
  }

  /**
   * Generate sitemap XML
   */
  public generateSitemap(venues: any[]): string {
    const baseUrl = 'https://bestofrsa.com';
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/places-to-eat', priority: 0.9, changefreq: 'daily' },
      { url: '/places-to-stay', priority: 0.9, changefreq: 'daily' },
      { url: '/places-to-visit', priority: 0.9, changefreq: 'daily' },
      { url: '/things-to-do', priority: 0.9, changefreq: 'daily' }
    ];
    
    const venuePages = venues.map(venue => ({
      url: `/${venue.category}/${this.generateSlug(venue.name)}`,
      priority: venue.score >= 8 ? 0.8 : 0.7,
      changefreq: 'weekly',
      lastmod: venue.last_enhanced || venue.updated_at || new Date().toISOString()
    }));
    
    const allPages = [...staticPages, ...venuePages];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    
    return sitemap;
  }

  /**
   * Batch enhance venues
   */
  public async enhanceVenuesBatch(venues: any[]): Promise<EnhancedVenue[]> {
    const enhanced: EnhancedVenue[] = [];
    
    for (const venue of venues) {
      try {
        const seoMeta = this.generateSEOMetadata(venue);
        const tags = this.generateTags(venue);
        const summaries = this.generateSummaries(venue, venue.reviews || []);
        const structuredData = this.generateStructuredData(venue);
        const contentQuality = this.calculateContentQuality(venue);
        
        const enhancedVenue: EnhancedVenue = {
          ...venue,
          seo: seoMeta,
          tags,
          summaries,
          structured_data: structuredData,
          content_quality_score: contentQuality,
          last_enhanced: new Date().toISOString(),
          slug: this.generateSlug(venue.name),
          search_keywords: this.generateSearchKeywords(venue),
          related_venues: this.findRelatedVenues(venue, venues)
        };
        
        enhanced.push(enhancedVenue);
      } catch (error) {
        console.error(`Enhancement failed for ${venue.name}:`, error);
      }
    }
    
    return enhanced;
  }

  // Helper methods
  private getArticle(word: string): string {
    if (!word) return 'a';
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    return vowels.includes(word[0].toLowerCase()) ? 'an' : 'a';
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by']);
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getSchemaType(category: string): string {
    const schemaMap: Record<string, string> = {
      'places-to-eat': 'Restaurant',
      'places-to-stay': 'Hotel',
      'places-to-visit': 'TouristAttraction',
      'things-to-do': 'TouristAttraction'
    };
    return schemaMap[category] || 'LocalBusiness';
  }

  private convertToSchemaHours(hours: any): any[] {
    if (!hours) return [];
    const dayMap: Record<string, string> = {
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    };
    
    return Object.entries(hours).map(([day, time]) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": dayMap[day],
      "opens": (time as string).split(' to ')[0],
      "closes": (time as string).split(' to ')[1]
    }));
  }

  private getHighlight(venue: any): string {
    if (venue.score >= 9) return 'Exceptional quality and service.';
    if (venue.score >= 8) return 'Highly rated by visitors.';
    if (venue.featured) return 'Featured destination.';
    return 'Popular choice in the area.';
  }

  private getReviewHighlight(reviews: any[]): string {
    if (!reviews || reviews.length === 0) return '';
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    if (avgRating >= 4.5) return 'Consistently excellent reviews.';
    if (avgRating >= 4) return 'Great customer feedback.';
    return 'Positive visitor experiences.';
  }

  private generateDescription(venue: any): string {
    const templates: Record<string, string> = {
      'places-to-eat': `This ${venue.restaurant_data?.cuisines?.[0] || 'dining'} establishment offers an exceptional culinary experience in the heart of ${venue.location}.`,
      'places-to-stay': `This ${venue.hotel_data?.star_rating || 'premium'}-star accommodation provides luxury and comfort for discerning travelers.`,
      'places-to-visit': `A must-visit ${venue.subcategory?.toLowerCase() || 'attraction'} that showcases the best of ${venue.location}'s cultural and natural heritage.`,
      'things-to-do': `An exciting ${venue.activity_data?.difficulty?.toLowerCase() || 'adventure'} experience perfect for ${venue.activity_data?.age_restriction || 'all ages'}.`
    };
    
    return templates[venue.category] || `A premier destination in ${venue.location} offering exceptional experiences.`;
  }

  private getIdealFor(venue: any): string {
    const idealMap: Record<string, string> = {
      'places-to-eat': 'food enthusiasts, romantic dinners, and special occasions',
      'places-to-stay': 'luxury travelers, business trips, and romantic getaways',
      'places-to-visit': 'tourists, families, and culture enthusiasts',
      'things-to-do': 'adventure seekers, groups, and active travelers'
    };
    
    return idealMap[venue.category] || 'visitors seeking quality experiences';
  }

  private getPriceInfo(venue: any): string {
    if (venue.price_range) {
      const priceMap: Record<string, string> = {
        '$': 'Budget-friendly pricing.',
        '$$': 'Moderate pricing with great value.',
        '$$$': 'Upscale pricing for premium experiences.',
        '$$$$': 'Luxury pricing for exclusive experiences.'
      };
      return priceMap[venue.price_range] || '';
    }
    return '';
  }

  private getDefaultImage(category: string): string {
    const defaultImages: Record<string, string> = {
      'restaurant': 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630',
      'hotel': 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630',
      'attraction': 'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630',
      'activity': 'https://images.pexels.com/photos/59989/elephant-herd-of-elephants-africa-wild-animals-59989.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630'
    };
    
    return defaultImages[category] || defaultImages.attraction;
  }

  private generateSearchKeywords(venue: any): string[] {
    const keywords = new Set<string>();
    
    // Primary keywords
    keywords.add(venue.name.toLowerCase());
    keywords.add(`${venue.name.toLowerCase()} ${venue.location.toLowerCase()}`);
    keywords.add(`${venue.subcategory?.toLowerCase()} ${venue.location.toLowerCase()}`);
    
    // Category keywords
    if (venue.category === 'places-to-eat') {
      venue.restaurant_data?.cuisines?.forEach((cuisine: string) => {
        keywords.add(`${cuisine.toLowerCase()} restaurant ${venue.location.toLowerCase()}`);
      });
    }
    
    // Location variations
    keywords.add(`best ${venue.subcategory?.toLowerCase()} ${venue.location.toLowerCase()}`);
    keywords.add(`top ${venue.subcategory?.toLowerCase()} ${venue.location.toLowerCase()}`);
    
    return Array.from(keywords).slice(0, 10);
  }

  private findRelatedVenues(venue: any, allVenues: any[]): string[] {
    return allVenues
      .filter(v => 
        v.id !== venue.id && 
        (v.location === venue.location || v.subcategory === venue.subcategory)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(v => v.id);
  }
}