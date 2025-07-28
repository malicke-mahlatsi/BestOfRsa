import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Star,
  MapPin
} from 'lucide-react';
import { 
  getPlacesWithQuality, 
  getQualityStatistics, 
  bulkInsertPlaces,
  calculatePlaceQualityScore,
  getScrapingJobs,
  createScrapingJob,
  getLowQualityPlaces
} from '../api/places';
import { PlaceWithQuality, ScrapingJob } from '../types/database';

const DatabaseManagementPanel: React.FC = () => {
  const [places, setPlaces] = useState<PlaceWithQuality[]>([]);
  const [scrapingJobs, setScrapingJobs] = useState<ScrapingJob[]>([]);
  const [qualityStats, setQualityStats] = useState<any>(null);
  const [lowQualityPlaces, setLowQualityPlaces] = useState<PlaceWithQuality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'places' | 'jobs' | 'quality'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [placesData, jobsData, statsData, lowQualityData] = await Promise.all([
        getPlacesWithQuality({ limit: 50 }),
        getScrapingJobs({ limit: 20 }),
        getQualityStatistics(),
        getLowQualityPlaces(60)
      ]);

      setPlaces(placesData);
      setScrapingJobs(jobsData);
      setQualityStats(statsData);
      setLowQualityPlaces(lowQualityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkQualityCalculation = async () => {
    setIsLoading(true);
    try {
      const placeIds = places.slice(0, 10).map(p => p.id);
      
      for (const placeId of placeIds) {
        await calculatePlaceQualityScore(placeId);
      }
      
      await loadDashboardData();
    } catch (error) {
      console.error('Error calculating quality scores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: React.ReactNode; 
    color?: string;
    trend?: number;
  }> = ({ title, value, subtitle, icon, color = 'text-[#D4AF37]', trend }) => (
    <div className="bento-card bg-white border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={color}>{icon}</div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500">{subtitle}</div>
          )}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span>{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'places', label: 'Places', icon: MapPin },
    { id: 'jobs', label: 'Scraping Jobs', icon: RefreshCw },
    { id: 'quality', label: 'Quality Control', icon: Star }
  ] as const;

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
            Database Management Panel
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Monitor and manage your BestOfRSA database with advanced analytics and quality control
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bento-container grid-cols-4 mb-8">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`bento-card flex items-center justify-center gap-3 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-[#D4AF37] text-[#0c1824] border-[#D4AF37]'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && qualityStats && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="bento-container grid-cols-2 md:grid-cols-4">
                <StatCard
                  title="Total Places"
                  value={qualityStats.total_places.toLocaleString()}
                  subtitle="Active venues"
                  icon={<Database className="w-6 h-6" />}
                  color="text-blue-600"
                  trend={12}
                />
                <StatCard
                  title="Verified Places"
                  value={qualityStats.verified_places.toLocaleString()}
                  subtitle={`${Math.round((qualityStats.verified_places / qualityStats.total_places) * 100)}% verified`}
                  icon={<CheckCircle className="w-6 h-6" />}
                  color="text-green-600"
                  trend={8}
                />
                <StatCard
                  title="Average Quality"
                  value={`${Math.round(qualityStats.average_quality)}/100`}
                  subtitle="Data completeness"
                  icon={<Star className="w-6 h-6" />}
                  color="text-yellow-600"
                  trend={5}
                />
                <StatCard
                  title="Featured Places"
                  value={qualityStats.featured_places.toLocaleString()}
                  subtitle="Premium listings"
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="text-purple-600"
                  trend={15}
                />
              </div>

              {/* Quality Distribution */}
              <div className="bento-card bg-white">
                <h3 className="text-xl font-cinzel font-bold text-gray-900 mb-6">Quality Distribution</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {qualityStats.high_quality}
                    </div>
                    <div className="text-sm font-medium text-green-700">High Quality (80+)</div>
                    <div className="text-xs text-green-600 mt-1">
                      {Math.round((qualityStats.high_quality / qualityStats.total_places) * 100)}%
                    </div>
                  </div>
                  <div className="text-center p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="text-4xl font-bold text-yellow-600 mb-2">
                      {qualityStats.medium_quality}
                    </div>
                    <div className="text-sm font-medium text-yellow-700">Medium Quality (50-79)</div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {Math.round((qualityStats.medium_quality / qualityStats.total_places) * 100)}%
                    </div>
                  </div>
                  <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
                    <div className="text-4xl font-bold text-red-600 mb-2">
                      {qualityStats.low_quality}
                    </div>
                    <div className="text-sm font-medium text-red-700">Needs Work (&lt;50)</div>
                    <div className="text-xs text-red-600 mt-1">
                      {Math.round((qualityStats.low_quality / qualityStats.total_places) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bento-container grid-cols-1 lg:grid-cols-2">
                <div className="bento-card bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Places</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {places.slice(0, 5).map((place) => (
                      <div key={place.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{place.name}</div>
                          <div className="text-sm text-gray-600">{place.address}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            (place.data_quality_score || 0) >= 80 ? 'text-green-600' :
                            (place.data_quality_score || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {Math.round(place.data_quality_score || 0)}/100
                          </div>
                          {place.is_verified && (
                            <CheckCircle className="w-4 h-4 text-green-500 inline ml-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bento-card bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {scrapingJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{job.job_type}</div>
                          <div className="text-sm text-gray-600">{job.city} • {job.category}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {job.successful_items}/{job.total_items || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-8">
              {/* Quality Actions */}
              <div className="bento-card bg-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-cinzel font-bold text-gray-900">Quality Control Actions</h3>
                  <button
                    onClick={handleBulkQualityCalculation}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-[#D4AF37] text-white px-4 py-2 rounded-lg hover:bg-[#B8941F] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                    Recalculate Quality Scores
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Low Quality Places</h4>
                    <div className="text-2xl font-bold text-red-600">{lowQualityPlaces.length}</div>
                    <div className="text-sm text-red-600">Need attention</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Unverified Places</h4>
                    <div className="text-2xl font-bold text-yellow-600">
                      {qualityStats ? qualityStats.total_places - qualityStats.verified_places : 0}
                    </div>
                    <div className="text-sm text-yellow-600">Pending verification</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Missing Images</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {places.filter(p => !p.images || p.images.length === 0).length}
                    </div>
                    <div className="text-sm text-blue-600">Need photos</div>
                  </div>
                </div>
              </div>

              {/* Low Quality Places List */}
              <div className="bento-card bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Places Needing Attention</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lowQualityPlaces.map((place) => (
                    <div key={place.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{place.name}</div>
                        <div className="text-sm text-gray-600">{place.address || 'No address'}</div>
                        <div className="flex gap-2 mt-2">
                          {!place.phone && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">No phone</span>}
                          {!place.website && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">No website</span>}
                          {!place.description && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">No description</span>}
                          {(!place.images || place.images.length === 0) && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">No images</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {Math.round(place.data_quality_score || 0)}/100
                        </div>
                        <button className="text-sm text-[#D4AF37] hover:text-[#B8941F] font-medium">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
                <span className="text-gray-900 font-medium">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManagementPanel;