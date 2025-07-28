import { DataPipeline, PipelineResult } from './DataPipeline';
import { supabase } from '../lib/supabase';
import { queueManager } from '../queue';

export class BatchProcessor {
  private pipeline: DataPipeline;

  constructor() {
    this.pipeline = new DataPipeline();
  }

  // Process and save a batch of places
  async processAndSave(
    items: any[],
    options: {
      source: string;
      category?: string;
      skipDuplicates?: boolean;
      enrichAll?: boolean;
    }
  ): Promise<{
    processed: number;
    saved: number;
    duplicates: number;
    errors: number;
    results: PipelineResult[];
  }> {
    const stats = {
      processed: 0,
      saved: 0,
      duplicates: 0,
      errors: 0,
      results: [] as PipelineResult[]
    };

    // Process items through pipeline
    const results = await this.pipeline.processBatch(items, {
      skipDuplicateCheck: false,
      skipEnhancement: !options.enrichAll
    });

    stats.results = results;

    // Separate valid items from errors and duplicates
    const toSave: any[] = [];

    for (const result of results) {
      stats.processed++;

      if (result.errors.length > 0) {
        stats.errors++;
        console.error('Pipeline errors:', result.errors);
        continue;
      }

      if (result.isDuplicate && options.skipDuplicates) {
        stats.duplicates++;
        continue;
      }

      // Prepare for saving - only include fields that exist in the schema
      const placeData: any = {
        name: result.validated.name,
        address: result.validated.address,
        rating: result.validated.rating,
        category: result.validated.category || options.category || 'general',
        location: result.validated.location,
        photos: result.validated.photos || []
      };

      toSave.push(placeData);
    }

    // Bulk save to database
    if (toSave.length > 0) {
      try {
        const { data: saved, error } = await supabase
          .from('places')
          .insert(toSave)
          .select();

        if (error) {
          console.error('Database save error:', error);
          stats.errors += toSave.length;
        } else {
          stats.saved = saved?.length || 0;

          // Queue enrichment jobs for saved items
          if (!options.enrichAll && saved && saved.length > 0) {
            for (const place of saved) {
              await queueManager.addJob('enrich', {
                placeId: place.id,
                category: options.category
              }, { priority: 3 });
            }
          }
        }
      } catch (error) {
        console.error('Save error:', error);
        stats.errors += toSave.length;
      }
    }

    return stats;
  }

  // Process a single text input (like Perplexity response)
  async processTextInput(
    text: string,
    options: {
      source: string;
      category?: string;
      skipDuplicates?: boolean;
    }
  ): Promise<{
    processed: number;
    saved: number;
    duplicates: number;
    errors: number;
    results: PipelineResult[];
  }> {
    // Parse the text first to extract individual businesses
    const pipeline = new DataPipeline();
    const result = await pipeline.process(text, {
      skipDuplicateCheck: false,
      skipEnhancement: false,
      category: options.category
    });

    const stats = {
      processed: 1,
      saved: 0,
      duplicates: 0,
      errors: 0,
      results: [result]
    };

    if (result.errors.length > 0) {
      stats.errors = 1;
      return stats;
    }

    if (result.isDuplicate && options.skipDuplicates) {
      stats.duplicates = 1;
      return stats;
    }

    // Save to database
    try {
      const placeData: any = {
        name: result.validated.name,
        address: result.validated.address,
        rating: result.validated.rating,
        category: result.validated.category || options.category || 'general',
        location: result.validated.location,
        photos: result.validated.photos || []
      };

      const { data: saved, error } = await supabase
        .from('places')
        .insert(placeData)
        .select()
        .single();

      if (error) {
        console.error('Database save error:', error);
        stats.errors = 1;
      } else {
        stats.saved = 1;

        // Queue enrichment job
        await queueManager.addJob('enrich', {
          placeId: saved.id,
          category: options.category
        }, { priority: 3 });
      }
    } catch (error) {
      console.error('Save error:', error);
      stats.errors = 1;
    }

    return stats;
  }

  // Get processing statistics
  async getProcessingStats(): Promise<{
    totalProcessed: number;
    totalSaved: number;
    totalDuplicates: number;
    totalErrors: number;
    averageConfidence: number;
    categoryBreakdown: Record<string, number>;
  }> {
    try {
      const { data: places, error } = await supabase
        .from('places')
        .select('category, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) throw error;

      const categoryBreakdown: Record<string, number> = {};
      
      for (const place of places || []) {
        const category = place.category || 'general';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      }

      return {
        totalProcessed: places?.length || 0,
        totalSaved: places?.length || 0,
        totalDuplicates: 0, // Would need to track this separately
        totalErrors: 0, // Would need to track this separately
        averageConfidence: 75, // Placeholder
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return {
        totalProcessed: 0,
        totalSaved: 0,
        totalDuplicates: 0,
        totalErrors: 0,
        averageConfidence: 0,
        categoryBreakdown: {}
      };
    }
  }
}