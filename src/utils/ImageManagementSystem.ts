export interface ImageSource {
  url: string;
  type: 'direct' | 'social' | 'placeholder';
  platform?: string;
  valid?: boolean;
  contentType?: string;
  size?: string;
  category: 'hero' | 'gallery' | 'thumbnail' | 'social';
}

export interface ImageManifest {
  venue_id: string;
  images: {
    hero: string;
    gallery: string[];
    thumbnail: string;
    social_share: string;
  };
  sources: {
    unsplash: string[];
    pexels: string[];
    direct: string[];
    social: Record<string, string>;
  };
  metadata: {
    last_updated: string;
    validation_status: 'pending' | 'validated' | 'failed';
    placeholder_percentage: number;
    total_images: number;
  };
}

export class ImageManagementSystem {
  private readonly imagePromptTemplates = {
    venue: `Find official website and social media pages for [VENUE_NAME] in [LOCATION], South Africa. Include:
- Official website URL with photo galleries
- Facebook page URL (likely has interior/food photos)
- Instagram handle (@username format)
- TripAdvisor page URL with user photos
- Google Business listing URL
- Any travel blog mentions with photos
Note which platforms have the most photos available.`,

    general: `List tourism websites and travel blogs featuring [LOCATION], South Africa that showcase:
- Restaurant interiors and food photography
- Hotel rooms, lobbies, and amenity photos  
- Tourist attractions and activity photos
- Local scenery and landmark photography
- Travel photography collections
Include specific page URLs where high-quality images are featured.`,

    category_specific: {
      restaurant: `Find food photography and restaurant images for [VENUE_NAME]:
- Menu item photography
- Interior dining room photos
- Kitchen and chef photos
- Wine cellar or bar area photos
- Outdoor seating or terrace photos
- Food styling and presentation photos`,

      hotel: `Find accommodation photography for [VENUE_NAME]:
- Hotel room and suite photos
- Bathroom and amenity photos
- Lobby and common area photos
- Pool, spa, and fitness facility photos
- Restaurant and bar area photos
- Exterior and grounds photography`,

      attraction: `Find tourism photography for [VENUE_NAME]:
- Landmark and scenic photography
- Activity and experience photos
- Visitor and crowd photos showing scale
- Different seasonal/time of day photos
- Aerial or panoramic views
- Historical or cultural significance photos`
    }
  };

  /**
   * Generate smart placeholder images based on venue data
   */
  public generateSmartPlaceholders(venue: any): Record<string, string[]> {
    const baseParams = this.buildImageParams(venue);
    
    const imageCategories = {
      restaurant: {
        hero: [
          `https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`
        ],
        gallery: [
          `https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/2290070/pexels-photo-2290070.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/3887985/pexels-photo-3887985.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`
        ],
        dishes: this.generateDishImages(venue.cuisine || 'gourmet')
      },
      hotel: {
        hero: [
          `https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/3757144/pexels-photo-3757144.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`
        ],
        rooms: [
          `https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/600622/pexels-photo-600622.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`
        ],
        amenities: [
          `https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/3757144/pexels-photo-3757144.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`
        ]
      },
      attraction: {
        hero: [
          `https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/1570610/pexels-photo-1570610.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`
        ],
        gallery: [
          `https://images.pexels.com/photos/59989/elephant-herd-of-elephants-africa-wild-animals-59989.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`
        ]
      },
      activity: {
        hero: [
          `https://images.pexels.com/photos/59989/elephant-herd-of-elephants-africa-wild-animals-59989.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`,
          `https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800`
        ],
        gallery: [
          `https://images.pexels.com/photos/59989/elephant-herd-of-elephants-africa-wild-animals-59989.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`,
          `https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=800&h=600`
        ]
      }
    };

    const categoryKey = venue.category?.replace('places-to-', '').replace('things-to-', 'activity') || 'attraction';
    return imageCategories[categoryKey as keyof typeof imageCategories] || imageCategories.attraction;
  }

  /**
   * Generate cuisine-specific dish images
   */
  private generateDishImages(cuisine: string): string[] {
    const dishImageIds = {
      'Italian': ['1279330', '1640777', '1640770', '1279330'],
      'Asian': ['1640777', '1640770', '1279330', '1640777'],
      'Seafood': ['1267320', '1640777', '1640770', '1279330'],
      'Steakhouse': ['1640777', '1640770', '1279330', '1640777'],
      'Fine Dining': ['1279330', '1640777', '1640770', '1279330'],
      'Traditional': ['1640777', '1640770', '1279330', '1640777']
    };

    const imageIds = dishImageIds[cuisine] || dishImageIds['Fine Dining'];
    
    return imageIds.map(id => 
      `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400`
    );
  }

  /**
   * Build image search parameters
   */
  private buildImageParams(venue: any): Record<string, string> {
    return {
      location: venue.location?.toLowerCase().replace(/\s+/g, '-') || 'south-africa',
      category: venue.category || 'venue',
      cuisine: venue.cuisine?.toLowerCase().replace(/\s+/g, '-') || '',
      name: venue.name?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-') || ''
    };
  }

  /**
   * Parse image URLs from Perplexity response
   */
  public parseImageUrls(response: string): { directUrls: string[]; socialProfiles: Record<string, string> } {
    // Extract direct image URLs
    const imageUrlPattern = /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s<>"']*)?/gi;
    const directUrls = response.match(imageUrlPattern) || [];

    // Extract social media profiles
    const socialPatterns = {
      facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\s<>"']+/gi,
      instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s<>"']+/gi,
      tripadvisor: /(?:https?:\/\/)?(?:www\.)?tripadvisor\.[a-z.]+\/[^\s<>"']+/gi,
      website: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"']*)?/gi
    };

    const socialProfiles: Record<string, string> = {};
    
    Object.entries(socialPatterns).forEach(([platform, pattern]) => {
      const matches = response.match(pattern);
      if (matches && matches.length > 0) {
        // Take the first match and ensure it has protocol
        let url = matches[0];
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        socialProfiles[platform] = url;
      }
    });

    return { directUrls: [...new Set(directUrls)], socialProfiles };
  }

  /**
   * Validate image URLs
   */
  public async validateImageUrls(urls: string[]): Promise<ImageSource[]> {
    const validationPromises = urls.map(async (url): Promise<ImageSource> => {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'no-cors' // Handle CORS issues
        });
        
        return {
          url,
          type: 'direct',
          valid: response.ok,
          contentType: response.headers.get('content-type') || undefined,
          size: response.headers.get('content-length') || undefined,
          category: this.categorizeImageUrl(url)
        };
      } catch (error) {
        // If HEAD request fails, assume it might still be valid
        return {
          url,
          type: 'direct',
          valid: true, // Assume valid for no-cors requests
          category: this.categorizeImageUrl(url)
        };
      }
    });

    const results = await Promise.all(validationPromises);
    return results.filter(result => result.valid);
  }

  /**
   * Categorize image URL based on content
   */
  private categorizeImageUrl(url: string): 'hero' | 'gallery' | 'thumbnail' | 'social' {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('hero') || urlLower.includes('banner') || urlLower.includes('cover')) {
      return 'hero';
    }
    if (urlLower.includes('thumb') || urlLower.includes('small') || urlLower.includes('150x') || urlLower.includes('200x')) {
      return 'thumbnail';
    }
    if (urlLower.includes('social') || urlLower.includes('share') || urlLower.includes('og-')) {
      return 'social';
    }
    
    return 'gallery';
  }

  /**
   * Build complete image manifest for venue
   */
  public buildImageManifest(venue: any, imageData: any): ImageManifest {
    const placeholders = this.generateSmartPlaceholders(venue);
    
    return {
      venue_id: venue.id,
      images: {
        hero: imageData.hero || placeholders.hero?.[0] || placeholders.gallery?.[0] || '',
        gallery: imageData.gallery || placeholders.gallery || [],
        thumbnail: imageData.thumbnail || this.generateThumbnail(imageData.hero || placeholders.hero?.[0]),
        social_share: imageData.social || this.generateSocialImage(venue)
      },
      sources: {
        unsplash: [], // Legacy support
        pexels: placeholders.gallery || [],
        direct: imageData.directUrls || [],
        social: imageData.socialProfiles || {}
      },
      metadata: {
        last_updated: new Date().toISOString(),
        validation_status: imageData.validationStatus || 'pending',
        placeholder_percentage: this.calculatePlaceholderPercentage(imageData),
        total_images: (imageData.gallery?.length || 0) + (imageData.hero ? 1 : 0)
      }
    };
  }

  /**
   * Generate thumbnail from hero image
   */
  private generateThumbnail(heroUrl?: string): string {
    if (!heroUrl) {
      return 'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=400&h=300';
    }
    
    // Convert Pexels URL to thumbnail size
    if (heroUrl.includes('pexels.com')) {
      return heroUrl.replace(/w=\d+&h=\d+/, 'w=400&h=300');
    }
    
    return heroUrl;
  }

  /**
   * Generate social sharing image
   */
  private generateSocialImage(venue: any): string {
    const category = venue.category?.replace('places-to-', '').replace('things-to-', 'activity') || 'tourism';
    const location = venue.location?.toLowerCase().replace(/\s+/g, '-') || 'south-africa';
    
    return `https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630`;
  }

  /**
   * Calculate placeholder percentage
   */
  private calculatePlaceholderPercentage(imageData: any): number {
    const totalSlots = 1 + (imageData.gallerySize || 4); // Hero + gallery slots
    const realImages = (imageData.directUrls?.length || 0) + (imageData.hero && !imageData.hero.includes('pexels.com') ? 1 : 0);
    const placeholders = totalSlots - realImages;
    
    return Math.round((placeholders / totalSlots) * 100);
  }

  /**
   * Generate image search prompt
   */
  public generateImageSearchPrompt(venueName: string, location: string, category: string): string {
    const template = this.imagePromptTemplates.venue;
    return template
      .replace('[VENUE_NAME]', venueName)
      .replace('[LOCATION]', location);
  }

  /**
   * Generate category-specific image search prompt
   */
  public generateCategorySpecificPrompt(venueName: string, category: string): string {
    const categoryKey = category.replace('places-to-', '').replace('things-to-', 'activity') as keyof typeof this.imagePromptTemplates.category_specific;
    const template = this.imagePromptTemplates.category_specific[categoryKey] || this.imagePromptTemplates.venue;
    
    return template.replace('[VENUE_NAME]', venueName);
  }
}