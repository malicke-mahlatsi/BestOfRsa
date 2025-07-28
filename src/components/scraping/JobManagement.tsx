import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Trash2, RefreshCw, Plus, Filter,
  Clock, CheckCircle, AlertTriangle, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { queueManager } from '../../queue';
import { BulkImportModal } from './BulkImportModal';

interface Job {
  id: string;
  job_type: string;
  source: string;
  city: string;
  category: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
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

export const JobManagement: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    source: 'all'
  });

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    if (filters.status !== 'all') {
      filtered = filtered.filter(job => job.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(job => job.job_type === filters.type);
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(job => job.source === filters.source);
    }

    setFilteredJobs(filtered);
  };

  const createJob = async (type: string, data: any) => {
    try {
      await queueManager.addJob(type as any, data, { priority: 5 });
      loadJobs();
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      await supabase
        .from('scraping_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);
      
      loadJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  const retryJob = async (job: Job) => {
    try {
      await queueManager.addJob(job.job_type as any, {
        source: job.source,
        city: job.city,
        category: job.category
      }, { priority: job.priority });
      
      loadJobs();
    } catch (error) {
      console.error('Error retrying job:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      await supabase
        .from('scraping_jobs')
        .delete()
        .eq('id', jobId);
      
      loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleBulkImport = (data: any[]) => {
    // Process bulk import data
    data.forEach(item => {
      createJob('scrape', item);
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500/20 text-gray-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'cancelled': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading jobs...</p>
        </div>
      </div>
    );
  }

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
                Job Management
              </h1>
              <p className="text-gray-400">
                Create, monitor, and manage scraping jobs
              </p>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkImport(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Bulk Import
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => createJob('scrape', { url: 'https://example.com', category: 'restaurant' })}
                className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Job
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="scrape">Scrape</option>
              <option value="enrich">Enrich</option>
              <option value="validate">Validate</option>
            </select>
            
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual</option>
              <option value="osm">OpenStreetMap</option>
              <option value="scraping">Web Scraping</option>
            </select>
            
            <span className="text-gray-400 text-sm ml-auto">
              {filteredJobs.length} of {jobs.length} jobs
            </span>
          </div>
        </motion.div>

        {/* Jobs Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3">City</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Progress</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredJobs.map((job, index) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-white border-b border-gray-700/50 hover:bg-slate-700/30"
                    >
                      <td className="py-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                          <span className="capitalize">{job.status}</span>
                        </div>
                      </td>
                      <td className="py-4 capitalize">{job.job_type}</td>
                      <td className="py-4 capitalize">{job.source}</td>
                      <td className="py-4">{job.city}</td>
                      <td className="py-4 capitalize">{job.category}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
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
                      <td className="py-4 text-sm text-gray-400">
                        {formatTimeAgo(job.created_at)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {job.status === 'failed' && (
                            <button
                              onClick={() => retryJob(job)}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              title="Retry job"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          
                          {(job.status === 'pending' || job.status === 'processing') && (
                            <button
                              onClick={() => cancelJob(job.id)}
                              className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                              title="Cancel job"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {filteredJobs.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No jobs match the current filters
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
};