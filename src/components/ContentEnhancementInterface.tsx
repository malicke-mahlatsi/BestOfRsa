import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Download, 
  CheckCircle, 
  BarChart3, 
  Globe, 
  Search,
  FileText,
  Tag,
  Star,
  TrendingUp,
  Settings,
  Database
} from 'lucide-react';
import { ContentEnhancementEngine, EnhancedVenue } from '../utils/ContentEnhancementEngine';
import { dummyListings } from '../data/dummyData';

const ContentEnhancementInterface: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [enhancementProgress, setEnhancementProgress] = useState({ current: 0, total: 0 });
  const [enhancedVenues, setEnhancedVenues] = useState<EnhancedVenue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sitemapXML, setSitemapXML] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  const enhancementEngine = new ContentEnhancementEngine();

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'places-to-eat', label: 'Restaurants' },
    { value: 'places-to-stay', label: 'Hotels' },
    { value: 'places-to-visit', label: 'Attractions' },
    { value: 'things-to-do', label: 'Activities' }
  ];

  const qualityFilters = [
    { value: 'all', label: 'All Quality Levels' },
    { value: 'low', label: 'Low Quality Only (Score < 50)' },
    { value: 'medium', label: 'Medium Quality (Score 50-75)' },
    { value: 'high', label: 'High Quality (Score 75+)' }
  ];

  const runEnhancement = async () => {
    setIsProcessing(true);
    setEnhancementProgress({ current: 0, total: 0 });

    try {
      // Filter venues based on selection
      let venuesToEnhance = dummyListings;
      
      if (selectedCategory !== 'all') {
        venuesToEnhance = venuesToEnhance.filter(venue => venue.category === selectedCategory);
      }

      // Apply quality filter (simulate quality scores)
      if (qualityFilter !== 'all') {
        venuesToEnhance = venuesToEnhance.filter(venue => {
          const mockQuality = enhancementEngine.calculateContentQuality(venue);
          switch (qualityFilter) {
            case 'low': return mockQuality < 50;
            case 'medium': return mockQuality >= 50 && mockQuality < 75;
            case 'high': return mockQuality >= 75;
            default: return true;
          }
        });
      }

      setEnhancementProgress({ current: 0, total: venuesToEnhance.length });

      // Process venues in batches
      const batchSize = 5;
      const enhanced: EnhancedVenue[] = [];

      for (let i = 0; i < venuesToEnhance.length; i += batchSize) {
        const batch = venuesToEnhance.slice(i, i + batchSize);
        const batchEnhanced = await enhancementEngine.enhanceVenuesBatch(batch);
        enhanced.push(...batchEnhanced);
        
        setEnhancementProgress(prev => ({ ...prev, current: Math.min(prev.current + batchSize, prev.total) }));
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setEnhancedVenues(enhanced);
      setShowResults(true);

      // Generate sitemap
      const sitemap = enhancementEngine.generateSitemap(enhanced);
      setSitemapXML(sitemap);

    } catch (error) {
      console.error('Enhancement failed:', error);
      alert('Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportEnhancedData = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(enhancedVenues, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bestrsa-enhanced-content-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadSitemap = () => {
    const dataBlob = new Blob([sitemapXML], { type: 'application/xml' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const StatCard: React.FC<{ label: string; value: number | string; suffix?: string; icon: React.ReactNode; color?: string }> = 
    ({ label, value, suffix = '', icon, color = 'text-[#D4AF37]' }) => (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`${color} p-3 rounded-lg bg-gray-50`}>{icon}</div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{value}{suffix}</div>
            <div className="text-sm text-gray-600 font-medium">{label}</div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-cinzel font-bold text-[#D4AF37] mb-4">
            Content Enhancement System
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Automatically enhance venue data with SEO optimization, content generation, and structured markup for maximum search visibility
          </p>
        </motion.div>

        {/* Enhancement Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-6">Batch Content Enhancement</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category Filter</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Quality Filter</label>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white"
              >
                {qualityFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <motion.button
                onClick={runEnhancement}
                disabled={isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#D4AF37] 
                          text-[#0c1824] font-medium rounded-lg hover:bg-[#D4AF37]/90 
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0c1824]/30 border-t-[#0c1824] rounded-full animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Enhance Content
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Progress Bar */}
          {enhancementProgress.total > 0 && (
            <div className="bg-[#0c1824]/50 p-4 rounded-lg border border-[#D4AF37]/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Enhancing venues...</span>
                <span className="text-[#D4AF37] font-medium">
                  {enhancementProgress.current}/{enhancementProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(enhancementProgress.current / enhancementProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Enhancement Results */}
        {showResults && enhancedVenues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cinzel text-[#D4AF37]">Enhancement Results</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => exportEnhancedData('json')}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                <button
                  onClick={downloadSitemap}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Download Sitemap
                </button>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Venues Enhanced"
                value={enhancedVenues.length}
                icon={<Database className="w-6 h-6" />}
                color="text-green-600"
              />
              <StatCard
                label="Avg Quality Score"
                value={Math.round(enhancedVenues.reduce((sum, v) => sum + v.content_quality_score, 0) / enhancedVenues.length)}
                suffix="/100"
                icon={<BarChart3 className="w-6 h-6" />}
                color="text-blue-600"
              />
              <StatCard
                label="Total Tags Generated"
                value={enhancedVenues.reduce((sum, v) => sum + v.tags.length, 0)}
                icon={<Tag className="w-6 h-6" />}
                color="text-purple-600"
              />
              <StatCard
                label="SEO Ready"
                value="100"
                suffix="%"
                icon={<Search className="w-6 h-6" />}
                color="text-orange-600"
              />
            </div>

            {/* Quality Distribution */}
            <div className="bg-white p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Quality Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">
                    {enhancedVenues.filter(v => v.content_quality_score >= 80).length}
                  </div>
                  <div className="text-sm text-green-700 font-medium">High Quality (80+)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600">
                    {enhancedVenues.filter(v => v.content_quality_score >= 60 && v.content_quality_score < 80).length}
                  </div>
                  <div className="text-sm text-yellow-700 font-medium">Medium Quality (60-79)</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-3xl font-bold text-red-600">
                    {enhancedVenues.filter(v => v.content_quality_score < 60).length}
                  </div>
                  <div className="text-sm text-red-700 font-medium">Needs Work (&lt;60)</div>
                </div>
              </div>
            </div>

            {/* Sample Enhanced Content */}
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sample Enhanced Content</h3>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {enhancedVenues.slice(0, 5).map((venue, index) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{venue.name}</h4>
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${getQualityColor(venue.content_quality_score)}`}>
                        Quality: {venue.content_quality_score}/100
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 font-medium mb-1">SEO Title:</div>
                      <div className="text-sm text-gray-800">{venue.seo.title}</div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 font-medium mb-1">Meta Description:</div>
                      <div className="text-sm text-gray-800">{venue.seo.description}</div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 font-medium mb-1">Generated Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {venue.tags.slice(0, 8).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border">
                            {tag}
                          </span>
                        ))}
                        {venue.tags.length > 8 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{venue.tags.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-lg font-bold text-gray-900">{venue.search_keywords.length}</div>
                        <div className="text-xs text-gray-600">Keywords</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-lg font-bold text-gray-900">{venue.related_venues.length}</div>
                        <div className="text-xs text-gray-600">Related</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-lg font-bold text-gray-900">
                          {venue.structured_data ? '✓' : '✗'}
                        </div>
                        <div className="text-xs text-gray-600">Schema</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sitemap Preview */}
            {sitemapXML && (
              <div className="bg-white p-6 rounded-lg mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Generated Sitemap Preview</h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 overflow-x-auto max-h-40">
                  {sitemapXML.split('\n').slice(0, 20).join('\n')}
                  {sitemapXML.split('\n').length > 20 && '\n... (truncated)'}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ContentEnhancementInterface;