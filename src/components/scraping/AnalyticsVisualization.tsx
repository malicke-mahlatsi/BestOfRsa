import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Calendar, MapPin, 
  Globe, Database, Users, Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsData {
  dailyStats: Array<{ date: string; count: number; quality: number }>;
  categoryBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  qualityTrends: Array<{ date: string; score: number }>;
}

export const AnalyticsVisualization: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dailyStats: [],
    categoryBreakdown: {},
    cityBreakdown: {},
    sourceBreakdown: {},
    qualityTrends: []
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Get places data
      const { data: places } = await supabase
        .from('places')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (places) {
        const analytics = processAnalyticsData(places, days);
        setAnalyticsData(analytics);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalyticsData = (places: any[], days: number): AnalyticsData => {
    // Generate daily stats
    const dailyStats = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPlaces = places.filter(place => 
        place.created_at?.startsWith(dateStr)
      );
      
      const avgQuality = dayPlaces.length > 0
        ? dayPlaces.reduce((sum, place) => sum + (place.rating || 0), 0) / dayPlaces.length * 20
        : 0;

      return {
        date: dateStr,
        count: dayPlaces.length,
        quality: Math.round(avgQuality)
      };
    });

    // Category breakdown
    const categoryBreakdown = places.reduce((acc, place) => {
      const category = place.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // City breakdown (extract from address)
    const cityBreakdown = places.reduce((acc, place) => {
      const address = place.address || '';
      let city = 'Unknown';
      
      const cities = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Stellenbosch'];
      for (const c of cities) {
        if (address.toLowerCase().includes(c.toLowerCase())) {
          city = c;
          break;
        }
      }
      
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Source breakdown (mock data since source_type might not exist)
    const sourceBreakdown = {
      'Manual': Math.floor(places.length * 0.4),
      'OSM': Math.floor(places.length * 0.35),
      'Scraping': Math.floor(places.length * 0.25)
    };

    // Quality trends
    const qualityTrends = dailyStats.map(stat => ({
      date: stat.date,
      score: stat.quality
    }));

    return {
      dailyStats,
      categoryBreakdown,
      cityBreakdown,
      sourceBreakdown,
      qualityTrends
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
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
                Analytics Dashboard
              </h1>
              <p className="text-gray-400">
                Insights and trends from your tourism data
              </p>
            </div>
            
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Daily Activity Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Daily Activity</h2>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {analyticsData.dailyStats.map((stat, index) => {
              const maxCount = Math.max(...analyticsData.dailyStats.map(s => s.count));
              const height = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
              
              return (
                <motion.div
                  key={stat.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg min-h-[4px] relative group"
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {new Date(stat.date).toLocaleDateString()}<br />
                    {stat.count} places
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{analyticsData.dailyStats[0]?.date}</span>
            <span>{analyticsData.dailyStats[analyticsData.dailyStats.length - 1]?.date}</span>
          </div>
        </motion.div>

        {/* Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
            
            <div className="space-y-3">
              {Object.entries(analyticsData.categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => {
                  const total = Object.values(analyticsData.categoryBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>

          {/* City Breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Cities</h2>
            
            <div className="space-y-3">
              {Object.entries(analyticsData.cityBreakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([city, count]) => {
                  const total = Object.values(analyticsData.cityBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={city} className="flex items-center justify-between">
                      <span className="text-gray-300">{city}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </div>

        {/* Quality Trends */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quality Trends</h2>
          
          <div className="h-48 flex items-end justify-between gap-1">
            {analyticsData.qualityTrends.map((trend, index) => {
              const height = (trend.score / 100) * 100;
              
              return (
                <motion.div
                  key={trend.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.02 }}
                  className="flex-1 bg-gradient-to-t from-yellow-500 to-orange-500 rounded-t-lg min-h-[4px] relative group"
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {new Date(trend.date).toLocaleDateString()}<br />
                    Quality: {trend.score}%
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Places"
            value={Object.values(analyticsData.categoryBreakdown).reduce((a, b) => a + b, 0)}
            icon={<Database className="w-5 h-5" />}
            color="blue"
          />
          
          <SummaryCard
            title="Categories"
            value={Object.keys(analyticsData.categoryBreakdown).length}
            icon={<Target className="w-5 h-5" />}
            color="green"
          />
          
          <SummaryCard
            title="Cities"
            value={Object.keys(analyticsData.cityBreakdown).length}
            icon={<MapPin className="w-5 h-5" />}
            color="purple"
          />
          
          <SummaryCard
            title="Sources"
            value={Object.keys(analyticsData.sourceBreakdown).length}
            icon={<Globe className="w-5 h-5" />}
            color="yellow"
          />
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600'
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
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      </div>
    </motion.div>
  );
};