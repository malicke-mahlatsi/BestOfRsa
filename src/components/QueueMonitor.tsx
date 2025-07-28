import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  BarChart3,
  Zap,
  Database,
  TrendingUp
} from 'lucide-react';
import { queueManager } from '../queue';
import { getScrapingJobs } from '../api/places';
import { ScrapingJob } from '../types/database';

interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  size: number;
}

const QueueMonitor: React.FC = () => {
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    size: 0
  });
  const [recentJobs, setRecentJobs] = useState<ScrapingJob[]>([]);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQueueData();
    
    // Set up real-time updates
    const interval = setInterval(loadQueueData, 2000);
    
    // Listen to queue events
    queueManager.on('job:completed', handleJobCompleted);
    queueManager.on('job:failed', handleJobFailed);
    queueManager.on('job:started', handleJobStarted);
    queueManager.on('queue:paused', () => setIsQueuePaused(true));
    queueManager.on('queue:resumed', () => setIsQueuePaused(false));

    return () => {
      clearInterval(interval);
      queueManager.removeAllListeners();
    };
  }, []);

  const loadQueueData = async () => {
    try {
      // Get queue statistics
      const queueStats = queueManager.getStats();
      
      // Get recent jobs from database
      const jobs = await getScrapingJobs({ limit: 10 });
      
      setStats(queueStats);
      setRecentJobs(jobs);
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobCompleted = ({ job, result }: any) => {
    console.log('Job completed:', job.id);
    loadQueueData();
  };

  const handleJobFailed = ({ job, error }: any) => {
    console.error('Job failed:', job.id, error);
    loadQueueData();
  };

  const handleJobStarted = (job: any) => {
    console.log('Job started:', job.id);
    loadQueueData();
  };

  const addTestJob = async (type: 'scrape' | 'enrich' | 'validate') => {
    try {
      const testData = {
        scrape: {
          url: 'https://example.com/restaurant',
          category: 'restaurant',
          city: 'Cape Town'
        },
        enrich: {
          placeId: 'test-place-id',
          enrichmentType: 'seo'
        },
        validate: {
          placeId: 'test-place-id',
          validationType: 'full'
        }
      };

      await queueManager.addJob(type, testData[type], { priority: 5 });
      loadQueueData();
    } catch (error) {
      console.error('Error adding test job:', error);
    }
  };

  const pauseQueue = () => {
    queueManager.pause();
    setIsQueuePaused(true);
  };

  const resumeQueue = () => {
    queueManager.resume();
    setIsQueuePaused(false);
  };

  const clearQueue = async () => {
    await queueManager.clear();
    loadQueueData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'processing': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'completed': return 'bg-green-50 border-green-200 text-green-800';
      case 'failed': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const StatCard: React.FC<{ 
    label: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string;
  }> = ({ label, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e] text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading queue monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-cinzel font-bold text-[#D4AF37] mb-4">
            Queue Monitor
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Real-time monitoring and management of scraping, enrichment, and validation jobs
          </p>
        </motion.div>

        {/* Queue Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-cinzel text-[#D4AF37]">Queue Controls</h2>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isQueuePaused ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {isQueuePaused ? 'Paused' : 'Running'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => addTestJob('scrape')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Add Scrape Job
            </button>
            
            <button
              onClick={() => addTestJob('enrich')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Add Enrich Job
            </button>
            
            <button
              onClick={() => addTestJob('validate')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Add Validate Job
            </button>
            
            <button
              onClick={isQueuePaused ? resumeQueue : pauseQueue}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isQueuePaused 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {isQueuePaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isQueuePaused ? 'Resume' : 'Pause'}
            </button>
            
            <button
              onClick={clearQueue}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Queue
            </button>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8"
        >
          <StatCard
            label="Pending Jobs"
            value={stats.pending}
            icon={<Clock className="w-6 h-6" />}
            color="text-yellow-600"
          />
          <StatCard
            label="Active Jobs"
            value={stats.active}
            icon={<RefreshCw className="w-6 h-6" />}
            color="text-blue-600"
          />
          <StatCard
            label="Queue Size"
            value={stats.size}
            icon={<Database className="w-6 h-6" />}
            color="text-purple-600"
          />
          <StatCard
            label="Completed"
            value={recentJobs.filter(j => j.status === 'completed').length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="text-green-600"
          />
          <StatCard
            label="Failed"
            value={recentJobs.filter(j => j.status === 'failed').length}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="text-red-600"
          />
        </motion.div>

        {/* Recent Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-cinzel font-bold text-gray-900 mb-6">Recent Jobs</h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border ${getStatusColor(job.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-semibold capitalize">
                        {job.job_type} Job
                      </div>
                      <div className="text-sm opacity-75">
                        {job.city} • {job.category || 'General'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Priority: {job.priority}
                    </div>
                    <div className="text-xs opacity-75">
                      {job.attempts}/{job.total_items || 1} attempts
                    </div>
                  </div>
                </div>
                
                {job.error_message && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {job.error_message}
                  </div>
                )}
                
                {job.status === 'processing' && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{job.processed_items}/{job.total_items || 1}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${job.total_items ? (job.processed_items / job.total_items) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            
            {recentJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent jobs found. Add a test job to get started.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QueueMonitor;