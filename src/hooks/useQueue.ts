import { useState, useEffect } from 'react';
import { queueManager } from '../queue';
import { supabase } from '../lib/supabase';

interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  size: number;
}

interface Job {
  id: string;
  job_type: string;
  source: string;
  city: string;
  category: string;
  status: string;
  priority: number;
  attempts: number;
  total_items?: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  error_message?: string;
}

export const useQueue = () => {
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    size: 0
  });
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadQueueData();
    
    // Set up real-time updates
    const interval = setInterval(loadQueueData, 3000);
    
    // Listen to queue events
    queueManager.on('job:completed', handleJobUpdate);
    queueManager.on('job:failed', handleJobUpdate);
    queueManager.on('job:started', handleJobUpdate);

    return () => {
      clearInterval(interval);
      queueManager.removeAllListeners();
    };
  }, []);

  const loadQueueData = async () => {
    try {
      // Get queue statistics
      const stats = queueManager.getStats();
      setQueueStats(stats);

      // Get jobs from database
      const { data: jobs } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (jobs) {
        setRecentJobs(jobs);
        setActiveJobs(jobs.filter(job => job.status === 'processing'));
      }
    } catch (error) {
      console.error('Error loading queue data:', error);
    }
  };

  const handleJobUpdate = () => {
    loadQueueData();
  };

  const pauseQueue = () => {
    queueManager.pause();
  };

  const resumeQueue = () => {
    queueManager.resume();
  };

  const clearQueue = async () => {
    await queueManager.clear();
    loadQueueData();
  };

  const addJob = async (type: string, data: any, options?: any) => {
    await queueManager.addJob(type as any, data, options);
    loadQueueData();
  };

  return {
    queueStats,
    activeJobs,
    recentJobs,
    pauseQueue,
    resumeQueue,
    clearQueue,
    addJob,
    loadQueueData
  };
};