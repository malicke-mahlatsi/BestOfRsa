import { QueueJob } from '../QueueManager';
import { supabase } from '../../lib/supabase';

export class ValidationProcessor {
  async process(job: QueueJob): Promise<any> {
    const { placeId, validationType } = job.data;

    // Get place data
    const { data: place, error: fetchError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (fetchError || !place) {
      throw new Error(`Place not found: ${placeId}`);
    }

    let validationResult: any = {};

    switch (validationType) {
      case 'contact':
        validationResult = await this.validateContactInfo(place);
        break;
      case 'location':
        validationResult = await this.validateLocation(place);
        break;
      case 'content':
        validationResult = await this.validateContent(place);
        break;
      case 'images':
        validationResult = await this.validateImages(place);
        break;
      default:
        validationResult = await this.fullValidation(place);
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(place, validationResult);

    // Update place with validation results
    const { data: updated, error: updateError } = await supabase
      .from('places')
      .update({
        data_quality_score: qualityScore,
        last_verified: new Date().toISOString(),
        is_verified: qualityScore >= 70
      })
      .eq('id', placeId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Save detailed quality scores
    await this.saveQualityScores(placeId, validationResult, qualityScore);

    return { place: updated, validation: validationResult, score: qualityScore };
  }

  private async validateContactInfo(place: any): Promise<any> {
    const scores = {
      phone: 0,
      website: 0,
      email: 0,
      address: 0
    };

    // Phone validation
    if (place.phone) {
      const phoneRegex = /^(\+27|0)[1-9]\d{8}$/;
      scores.phone = phoneRegex.test(place.phone.replace(/\s/g, '')) ? 100 : 50;
    }

    // Website validation
    if (place.website) {
      try {
        new URL(place.website);
        scores.website = 100;
      } catch {
        scores.website = 30;
      }
    }

    // Email validation
    if (place.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      scores.email = emailRegex.test(place.email) ? 100 : 30;
    }

    // Address validation
    if (place.address) {
      const hasStreetInfo = /\d+/.test(place.address);
      const hasCityInfo = /(cape town|johannesburg|durban|pretoria)/i.test(place.address);
      scores.address = (hasStreetInfo ? 50 : 0) + (hasCityInfo ? 50 : 0);
    }

    return {
      contact_scores: scores,
      contact_completeness: Object.values(scores).reduce((a, b) => a + b, 0) / 4
    };
  }

  private async validateLocation(place: any): Promise<any> {
    const scores = {
      coordinates: 0,
      address_accuracy: 0
    };

    // Coordinates validation
    if (place.location?.lat && place.location?.lng) {
      const lat = place.location.lat;
      const lng = place.location.lng;
      
      // Check if coordinates are within South Africa bounds
      const inSouthAfrica = lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33;
      scores.coordinates = inSouthAfrica ? 100 : 20;
    }

    // Address accuracy (would need geocoding to verify)
    if (place.address && place.location) {
      scores.address_accuracy = 80; // Placeholder - would geocode to verify
    }

    return {
      location_scores: scores,
      location_accuracy: Object.values(scores).reduce((a, b) => a + b, 0) / 2
    };
  }

  private async validateContent(place: any): Promise<any> {
    const scores = {
      name: 0,
      description: 0,
      category: 0
    };

    // Name validation
    if (place.name) {
      scores.name = place.name.length >= 3 && place.name.length <= 100 ? 100 : 50;
    }

    // Description validation
    if (place.description) {
      const length = place.description.length;
      if (length >= 50 && length <= 500) {
        scores.description = 100;
      } else if (length >= 20) {
        scores.description = 70;
      } else {
        scores.description = 30;
      }
    }

    // Category validation
    const validCategories = ['restaurant', 'hotel', 'tourist_attraction', 'activity'];
    scores.category = validCategories.includes(place.category) ? 100 : 50;

    return {
      content_scores: scores,
      content_quality: Object.values(scores).reduce((a, b) => a + b, 0) / 3
    };
  }

  private async validateImages(place: any): Promise<any> {
    const scores = {
      count: 0,
      quality: 0
    };

    const photos = place.photos || [];
    
    // Image count scoring
    if (photos.length >= 5) {
      scores.count = 100;
    } else if (photos.length >= 3) {
      scores.count = 80;
    } else if (photos.length >= 1) {
      scores.count = 60;
    }

    // Image quality (placeholder - would need actual image analysis)
    scores.quality = photos.length > 0 ? 80 : 0;

    return {
      image_scores: scores,
      image_quality: Object.values(scores).reduce((a, b) => a + b, 0) / 2
    };
  }

  private async fullValidation(place: any): Promise<any> {
    const contactValidation = await this.validateContactInfo(place);
    const locationValidation = await this.validateLocation(place);
    const contentValidation = await this.validateContent(place);
    const imageValidation = await this.validateImages(place);

    return {
      ...contactValidation,
      ...locationValidation,
      ...contentValidation,
      ...imageValidation,
      validated_at: new Date().toISOString()
    };
  }

  private calculateQualityScore(place: any, validation: any): number {
    const weights = {
      contact: 0.25,
      location: 0.20,
      content: 0.30,
      images: 0.25
    };

    const scores = {
      contact: validation.contact_completeness || 0,
      location: validation.location_accuracy || 0,
      content: validation.content_quality || 0,
      images: validation.image_quality || 0
    };

    const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);

    return Math.round(weightedScore);
  }

  private async saveQualityScores(placeId: string, validation: any, finalScore: number): Promise<void> {
    const qualityData = {
      place_id: placeId,
      name_score: validation.content_scores?.name || null,
      address_score: validation.location_scores?.address_accuracy || null,
      contact_score: validation.contact_completeness || null,
      description_score: validation.content_scores?.description || null,
      image_score: validation.image_quality || null,
      completeness_score: validation.contact_completeness || null,
      accuracy_score: validation.location_accuracy || null,
      final_score: finalScore
    };

    const { error } = await supabase
      .from('data_quality_scores')
      .insert(qualityData);

    if (error) {
      console.error('Error saving quality scores:', error);
    }
  }
}