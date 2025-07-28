import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RefreshCw, AlertCircle, CheckCircle, 
  Clock, Database, Globe, TrendingUp, Download,
  BarChart3, Users, Target, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { queueManager } from '../../queue';

interface SystemStats {
  totalPlaces: number;
  todayAdded: number;
  dataQuality: number;
  sources: Record<string, number>;
}

interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  size: number;
}

export const ScrapingDashboard: React.FC = () => {
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    size: 0
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalPlaces: 0,
    todayAdded: 0,
    dataQuality: 0,
    sources: {}
  });
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [isQueuePaused, setIsQueuePaused] = useState(false);

  useEffect(() => {
    loadSystemStats();
    loadQueueData();
    
    const interval = setInterval(() => {
      loadSystemStats();
      loadQueueData();
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      // Get total places
      const { count: totalPlaces } = await supabase
        .from('places')
        .select('*', { count: 'exact', head: true });

      // Get today's additions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayAdded } = await supabase
        .from('places')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setSystemStats({
        totalPlaces: totalPlaces || 0,
        todayAdded: todayAdded || 0,
        dataQuality: 85, // Mock data quality score
        sources: {
          'manual': 45,
          'osm': 32,
          'scraping': 23
        }
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadQueueData = async () => {
    try {
      const stats = queueManager.getStats();
      setQueueStats(stats);

      // Get recent jobs from database
      const { data: jobs } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentJobs(jobs || []);
      setActiveJobs(jobs?.filter(job => job.status === 'processing') || []);
    } catch (error) {
      console.error('Error loading queue data:', error);
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

  const addTestJob = async () => {
    await queueManager.addJob('scrape', {
      url: 'https://example.com/test',
      category: 'restaurant',
      source: 'test'
    }, { priority: 5 });
    loadQueueData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Tourism Data Scraping Dashboard
              </h1>
              <p className="text-gray-400">
                Monitor and control your data collection pipeline
              </p>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addTestJob}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Add Test Job
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isQueuePaused ? resumeQueue : pauseQueue}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors ${
                  isQueuePaused 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {isQueuePaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isQueuePaused ? 'Resume' : 'Pause'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearQueue}
                className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2 hover:bg-red-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Clear
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Places"
            value={systemStats.totalPlaces.toLocaleString()}
            icon={<Database className="w-5 h-5" />}
            trend={`+${systemStats.todayAdded} today`}
            color="blue"
          />
          
          <StatsCard
            title="Queue Size"
            value={queueStats.size}
            icon={<Clock className="w-5 h-5" />}
            trend={`${queueStats.active} active`}
            color="yellow"
          />
          
          <StatsCard
            title="Data Quality"
            value={`${systemStats.dataQuality}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="Average score"
            color="green"
          />
          
          <StatsCard
            title="Sources"
            value={Object.keys(systemStats.sources).length}
            icon={<Globe className="w-5 h-5" />}
            trend="Active sources"
            color="purple"
          />
        </div>

        {/* Active Jobs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Active Jobs</h2>
          
          <div className="space-y-3">
            <AnimatePresence>
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No active jobs at the moment
                </div>
              ) : (
                activeJobs.map((job) => (
                  <JobItem key={job.id} job={job} />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Jobs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Recent Jobs</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Progress</th>
                  <th className="pb-3">Started</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {recentJobs.map((job) => (
                  <RecentJobRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Data Sources Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Data Sources</h2>
          
          <div className="space-y-3">
            {Object.entries(systemStats.sources).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{source}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(count / systemStats.totalPlaces) * 100}%` 
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-16 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}> = ({ title, value, icon, trend, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full -mr-16 -mt-16`} />
      
      <div className="relative">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} mb-3`}>
          {icon}
        </div>
        
        <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{trend}</p>
      </div>
    </motion.div>
  );
};

// Job Item Component
const JobItem: React.FC<{ job: any }> = ({ job }) => {
  const progress = job.total_items 
    ? (job.processed_items / job.total_items) * 100 
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-slate-700 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white font-medium">{job.job_type}</span>
          <span className="text-gray-400 text-sm">{job.source}</span>
        </div>
        
        <span className="text-gray-400 text-sm">
          {job.processed_items} / {job.total_items || '?'}
        </span>
      </div>
      
      <div className="w-full bg-gray-600 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
        />
      </div>
    </motion.div>
  );
};

// Recent Job Row Component
const RecentJobRow: React.FC<{ job: any }> = ({ job }) => {
  const statusColors = {
    completed: 'text-green-400',
    failed: 'text-red-400',
    processing: 'text-yellow-400',
    pending: 'text-gray-400'
  };

  const statusIcons = {
    completed: <CheckCircle className="w-4 h-4" />,
    failed: <AlertCircle className="w-4 h-4" />,
    processing: <RefreshCw className="w-4 h-4 animate-spin" />,
    pending: <Clock className="w-4 h-4" />
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <tr className="border-t border-gray-700">
      <td className="py-3">{job.job_type}</td>
      <td className="py-3">{job.source}</td>
      <td className="py-3">
        <div className={`flex items-center gap-2 ${statusColors[job.status]}`}>
          {statusIcons[job.status]}
          <span className="capitalize">{job.status}</span>
        </div>
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ 
                width: `${job.total_items ? (job.processed_items / job.total_items) * 100 : 0}%` 
              }}
            />
          </div>
          <span className="text-xs text-gray-400">
            {job.processed_items}/{job.total_items || '?'}
          </span>
        </div>
      </td>
      <td className="py-3 text-sm text-gray-400">
        {job.started_at 
          ? formatTimeAgo(job.started_at)
          : 'Not started'
        }
      </td>
      <td className="py-3">
        <button className="text-blue-400 hover:text-blue-300 text-sm">
          View Details
        </button>
      </td>
    </tr>
  );
};