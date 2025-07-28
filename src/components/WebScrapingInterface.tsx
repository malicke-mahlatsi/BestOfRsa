import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Download, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle,
  X,
  BarChart3,
  Clock,
  Target,
  Zap,
  Database
} from 'lucide-react';
import { queueManager } from '../queue';
import { getScrapingJobs } from '../api/places';
import { ScrapingJob } from '../types/database';

interface WebScrapingJob {
  id: string;
  category: string;
  urls: string[];
  status: 'pending' | 'running' | 'completed' | 'paused' | 'error';
  progress: number;
  results: any[];
  startTime?: Date;
  endTime?: Date;
}

const WebScrapingInterface: React.FC = () => {
  const [jobs, setJobs] = useState<WebScrapingJob[]>([]);
  const [queueJobs, setQueueJobs] = useState<ScrapingJob[]>([]);
  const [newJobUrls, setNewJobUrls] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('restaurants');
  const [scraperConfig, setScraperConfig] = useState({
    requestsPerSecond: 1,
    maxRetries: 3,
    timeout: 30000
  });
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadQueueJobs();
    
    // Set up real-time updates
    const interval = setInterval(loadQueueJobs, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadQueueJobs = async () => {
    try {
      const jobs = await getScrapingJobs({ limit: 20 });
      setQueueJobs(jobs);
    } catch (error) {
      console.error('Error loading queue jobs:', error);
    }
  };

  const categories = [
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'hotel', label: 'Hotels' },
    { value: 'attraction', label: 'Attractions' },
    { value: 'activity', label: 'Activities' }
  ];

  const createScrapingJob = async () => {
    if (!newJobUrls.trim()) return;

    const urls = newJobUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'));

    if (urls.length === 0) {
      alert('Please enter valid URLs (must start with http/https)');
      return;
    }

    const newJob: WebScrapingJob = {
      id: Date.now().toString(),
      category: selectedCategory,
      urls,
      status: 'pending',
      progress: 0,
      results: []
    };

    setJobs(prev => [...prev, newJob]);
    
    // Add jobs to queue system
    for (const url of urls) {
      await queueManager.addJob('scrape', {
        url,
        category: selectedCategory,
        source: 'web_interface'
      }, { priority: 5 });
    }
    
    setNewJobUrls('');
    loadQueueJobs();
  };

  const addBulkJob = async (category: string, count: number = 10) => {
    // Add multiple test jobs to demonstrate queue functionality
    const testUrls = Array.from({ length: count }, (_, i) => 
      `https://example.com/${category}/${i + 1}`
    );
    
    for (const url of testUrls) {
      await queueManager.addJob('scrape', {
        url,
        category,
        source: 'bulk_test'
      }, { priority: Math.floor(Math.random() * 10) + 1 });
    }
    
    loadQueueJobs();
  };

  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const downloadResults = (job: WebScrapingJob) => {
    const successfulResults = job.results.filter(r => r.success);
    const dataStr = JSON.stringify(successfulResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${job.category}-scraping-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runScrapingJob = (jobId: string) => {
    // Implementation for running scraping job
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'processing': return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-50 border-gray-200';
      case 'processing': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-cinzel font-bold text-[#D4AF37] mb-4">
            Web Scraping Interface
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Extract tourism data from South African websites with intelligent parsing and rate limiting
          </p>
        </motion.div>

        {/* Configuration Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-6">Create Scraping Job</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requests/Second
              </label>
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.5"
                value={scraperConfig.requestsPerSecond}
                onChange={(e) => setScraperConfig(prev => ({
                  ...prev,
                  requestsPerSecond: parseFloat(e.target.value)
                }))}
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white"
              />
            </div>
            
            <div className="space-y-2">
              <motion.button
                onClick={() => addBulkJob(selectedCategory, 5)}
                disabled={isRunning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#D4AF37] text-[#0c1824] py-2 rounded-lg font-medium 
                          hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed 
                          transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Add 5 Test Jobs
              </motion.button>
              
              <motion.button
                onClick={() => addBulkJob(selectedCategory, 20)}
                disabled={isRunning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium 
                          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                          transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                Add 20 Bulk Jobs
              </motion.button>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom URLs (one per line)
            </label>
            <textarea
              value={newJobUrls}
              onChange={(e) => setNewJobUrls(e.target.value)}
              placeholder="https://example.com/restaurant1&#10;https://example.com/restaurant2&#10;https://example.com/restaurant3"
              className="w-full h-24 p-4 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg 
                        text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-[#D4AF37] 
                        focus:border-transparent"
            />
            <motion.button
              onClick={createScrapingJob}
              disabled={!newJobUrls.trim() || isRunning}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-3 bg-green-600 text-white px-6 py-2 rounded-lg font-medium 
                        hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed 
                        transition-all duration-300 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Create Custom Job
            </motion.button>
          </div>
        </motion.div>

        {/* Queue Jobs List */}
        {queueJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-6">Queue Jobs</h2>
            
            <div className="space-y-4">
              {queueJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-6 rounded-lg border ${getStatusColor(job.status)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {job.job_type} Job
                        </h3>
                        <p className="text-sm text-gray-600">
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {job.status === 'pending' && (
                        <button
                          onClick={() => runScrapingJob(job.id)}
                          disabled={isRunning}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
                                   disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start
                        </button>
                      )}
                      
                      {job.status === 'completed' && (
                        <button
                          onClick={() => downloadResults(job)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 
                                   transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 
                                 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {job.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Results Summary */}
                  {job.results && job.results.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {job.results.filter(r => r.success).length}
                        </div>
                        <div className="text-xs text-gray-600">Successful</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {job.results.filter(r => !r.success).length}
                        </div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {job.endTime && job.startTime 
                            ? Math.round((job.endTime.getTime() - job.startTime.getTime()) / 1000)
                            : 0}s
                        </div>
                        <div className="text-xs text-gray-600">Duration</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
            Scraping Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">Intelligent Extraction:</h4>
              <ul className="space-y-1">
                <li>• <strong>Restaurant Data:</strong> Cuisine, prices, hours, reviews</li>
                <li>• <strong>Hotel Data:</strong> Star rating, rooms, amenities</li>
                <li>• <strong>Attraction Data:</strong> Tickets, hours, facilities</li>
                <li>• <strong>Activity Data:</strong> Duration, difficulty, requirements</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Advanced Features:</h4>
              <ul className="space-y-1">
                <li>• <strong>Rate Limiting:</strong> Respectful crawling speeds</li>
                <li>• <strong>Error Handling:</strong> Automatic retries with backoff</li>
                <li>• <strong>Data Validation:</strong> Clean and normalize extracted data</li>
                <li>• <strong>Progress Tracking:</strong> Real-time job monitoring</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WebScrapingInterface;