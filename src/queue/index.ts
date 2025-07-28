import { QueueManager } from './QueueManager';
import { ScrapingProcessor } from './processors/ScrapingProcessor';
import { EnrichmentProcessor } from './processors/EnrichmentProcessor';
import { ValidationProcessor } from './processors/ValidationProcessor';

// Create and configure queue manager
export const queueManager = new QueueManager({
  concurrency: 5,
  interval: 1000,
  intervalCap: 2
});

// Register processors
const scrapingProcessor = new ScrapingProcessor();
queueManager.registerProcessor('scrape', (job) => scrapingProcessor.process(job));

const enrichmentProcessor = new EnrichmentProcessor();
queueManager.registerProcessor('enrich', (job) => enrichmentProcessor.process(job));

const validationProcessor = new ValidationProcessor();
queueManager.registerProcessor('validate', (job) => validationProcessor.process(job));

// Setup event logging
queueManager.on('job:completed', ({ job, result }) => {
  console.log(`Job ${job.id} completed successfully`);
});

queueManager.on('job:failed', ({ job, error }) => {
  console.error(`Job ${job.id} failed:`, (error as Error).message);
});

queueManager.on('job:retry', ({ job, error, delay }) => {
  console.log(`Job ${job.id} failed, retrying in ${delay}ms. Attempt ${job.attempts}/${job.maxAttempts}`);
});

queueManager.on('queue:error', (error) => {
  console.error('Queue error:', error);
});

queueManager.on('queue:idle', () => {
  console.log('Queue is idle - all jobs completed');
});

export default queueManager;

export * from './QueueManager';
export * from './processors/ScrapingProcessor';
export * from './processors/EnrichmentProcessor';
export * from './processors/ValidationProcessor';