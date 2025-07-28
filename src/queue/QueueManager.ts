import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { supabase } from '../lib/supabase';
import { ScrapingJob } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

export interface QueueJob {
  id: string;
  type: 'scrape' | 'enrich' | 'validate';
  priority: number;
  data: any;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processor: string;
}

export interface QueueOptions {
  concurrency: number;
  interval: number;
  intervalCap: number;
  timeout: number;
  throwOnTimeout: boolean;
}

export class QueueManager extends EventEmitter {
  private queue: PQueue;
  private activeJobs: Map<string, QueueJob> = new Map();
  private processors: Map<string, (job: QueueJob) => Promise<any>> = new Map();
  private checkInterval: NodeJS.Timer | null = null;

  constructor(options: Partial<QueueOptions> = {}) {
    super();

    const defaultOptions: QueueOptions = {
      concurrency: 5,
      interval: 1000,
      intervalCap: 2,
      timeout: 300000, // 5 minutes
      throwOnTimeout: true
    };

    const finalOptions = { ...defaultOptions, ...options };

    this.queue = new PQueue({
      concurrency: finalOptions.concurrency,
      interval: finalOptions.interval,
      intervalCap: finalOptions.intervalCap,
      timeout: finalOptions.timeout,
      throwOnTimeout: finalOptions.throwOnTimeout
    });

    this.setupEventHandlers();
    this.startJobChecker();
  }

  // Register a job processor
  registerProcessor(type: string, processor: (job: QueueJob) => Promise<any>): void {
    this.processors.set(type, processor);
  }

  // Add a job to the queue
  async addJob(
    type: QueueJob['type'],
    data: any,
    options: { priority?: number; processor?: string } = {}
  ): Promise<string> {
    const job: QueueJob = {
      id: uuidv4(),
      type,
      priority: options.priority || 5,
      data,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      processor: options.processor || type
    };

    // Save to database
    await this.saveJobToDatabase(job);

    // Add to queue with priority
    this.queue.add(
      () => this.processJob(job),
      { priority: job.priority }
    );

    this.emit('job:added', job);
    return job.id;
  }

  // Process a job
  private async processJob(job: QueueJob): Promise<any> {
    this.activeJobs.set(job.id, job);
    this.emit('job:started', job);

    try {
      // Update job status in database
      await this.updateJobStatus(job.id, 'processing');

      const processor = this.processors.get(job.processor);
      if (!processor) {
        throw new Error(`No processor registered for type: ${job.processor}`);
      }

      const result = await processor(job);

      // Mark job as completed
      await this.updateJobStatus(job.id, 'completed', { result });
      
      this.activeJobs.delete(job.id);
      this.emit('job:completed', { job, result });

      return result;
    } catch (error) {
      job.attempts++;

      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000;
        
        this.emit('job:retry', { job, error, delay });
        
        setTimeout(() => {
          this.queue.add(
            () => this.processJob(job),
            { priority: job.priority }
          );
        }, delay);

        await this.updateJobStatus(job.id, 'pending', { 
          error: (error as Error).message,
          attempts: job.attempts 
        });
      } else {
        // Max attempts reached
        await this.updateJobStatus(job.id, 'failed', { error: (error as Error).message });
        
        this.activeJobs.delete(job.id);
        this.emit('job:failed', { job, error });
      }

      throw error;
    }
  }

  // Save job to database
  private async saveJobToDatabase(job: QueueJob): Promise<void> {
    const { error } = await supabase.from('scraping_jobs').insert({
      id: job.id,
      job_type: job.type,
      source: job.data.source || 'manual',
      city: job.data.city || 'all',
      category: job.data.category,
      status: 'pending',
      priority: job.priority,
      metadata: job.data
    });

    if (error) {
      console.error('Error saving job to database:', error);
      throw error;
    }
  }

  // Update job status in database
  private async updateJobStatus(
    jobId: string,
    status: string,
    additionalData: any = {}
  ): Promise<void> {
    const updates: any = {
      status,
      ...additionalData
    };

    if (status === 'processing') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('scraping_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job status:', error);
    }
  }

  // Get queue statistics
  getStats(): {
    pending: number;
    active: number;
    completed: number;
    failed: number;
    size: number;
  } {
    return {
      pending: this.queue.pending,
      active: this.activeJobs.size,
      completed: 0, // Would need to track this
      failed: 0, // Would need to track this
      size: this.queue.size
    };
  }

  // Check for stale jobs in database
  private async checkForStaleJobs(): Promise<void> {
    try {
      // Find jobs that have been processing for too long
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

      const { data: staleJobs, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('status', 'processing')
        .lt('started_at', tenMinutesAgo.toISOString());

      if (error) {
        console.error('Error checking for stale jobs:', error);
        return;
      }

      // Reset stale jobs
      for (const job of staleJobs || []) {
        await this.updateJobStatus(job.id, 'pending', {
          error_message: 'Job timeout - reset for retry'
        });

        // Re-add to queue
        this.addJob(job.job_type as any, job.metadata, { priority: job.priority });
      }
    } catch (error) {
      console.error('Error in checkForStaleJobs:', error);
    }
  }

  // Start periodic job checker
  private startJobChecker(): void {
    this.checkInterval = setInterval(() => {
      this.checkForStaleJobs();
    }, 60000); // Check every minute
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.queue.on('active', () => {
      this.emit('queue:active');
    });

    this.queue.on('idle', () => {
      this.emit('queue:idle');
    });

    this.queue.on('error', (error) => {
      this.emit('queue:error', error);
    });
  }

  // Pause queue
  pause(): void {
    this.queue.pause();
    this.emit('queue:paused');
  }

  // Resume queue
  resume(): void {
    this.queue.start();
    this.emit('queue:resumed');
  }

  // Clear queue
  async clear(): Promise<void> {
    this.queue.clear();
    this.activeJobs.clear();
    this.emit('queue:cleared');
  }

  // Shutdown queue
  async shutdown(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    await this.queue.onIdle();
    this.removeAllListeners();
  }
}