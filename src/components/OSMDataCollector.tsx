import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  MapPin, 
  Search, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Globe,
  Target,
  Zap
} from 'lucide-react';
import { OSMImporter } from '../services/osm/OSMImporter';

interface ImportProgress {
  city: string;
  category: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  inserted: number;
  duplicates: number;
  error?: string;
}

const OSMDataCollector: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('Cape Town');
  const [selectedCategory, setSelectedCategory] = useState<string>('restaurants');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress[]>([]);
  const [totalStats, setTotalStats] = useState({ inserted: 0, duplicates: 0 });

  const osmImporter = new OSMImporter();
  const cities = osmImporter.getCities();
  const categories = osmImporter.getCategories();

  const categoryLabels: Record<string, string> = {
    restaurants: 'Restaurants & Cafes',
    hotels: 'Hotels & Accommodation',
    attractions: 'Tourist Attractions',
    activities: 'Activities & Leisure'
  };

  const handleSingleImport = async () => {
    if (!selectedCity || !selectedCategory) return;

    setIsImporting(true);
    const progressItem: ImportProgress = {
      city: selectedCity,
      category: selectedCategory,
      status: 'processing',
      inserted: 0,
      duplicates: 0
    };

    setImportProgress([progressItem]);

    try {
      const result = await osmImporter.importCityCategory(selectedCity, selectedCategory as any);
      
      setImportProgress([{
        ...progressItem,
        status: 'completed',
        inserted: result.inserted_count,
        duplicates: result.duplicate_count
      }]);

      setTotalStats(prev => ({
        inserted: prev.inserted + result.inserted_count,
        duplicates: prev.duplicates + result.duplicate_count
      }));

    } catch (error) {
      setImportProgress([{
        ...progressItem,
        status: 'error',
        error: (error as Error).message
      }]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleBulkImport = async () => {
    setIsImporting(true);
    setImportProgress([]);
    setTotalStats({ inserted: 0, duplicates: 0 });

    const allJobs: ImportProgress[] = [];
    
    // Create progress items for all combinations
    for (const city of cities) {
      for (const category of categories) {
        allJobs.push({
          city,
          category,
          status: 'pending',
          inserted: 0,
          duplicates: 0
        });
      }
    }

    setImportProgress([...allJobs]);

    // Process each job
    for (let i = 0; i < allJobs.length; i++) {
      const job = allJobs[i];
      
      // Update status to processing
      setImportProgress(prev => prev.map((item, index) => 
        index === i ? { ...item, status: 'processing' } : item
      ));

      try {
        const result = await osmImporter.importCityCategory(job.city, job.category as any);
        
        // Update with results
        setImportProgress(prev => prev.map((item, index) => 
          index === i ? {
            ...item,
            status: 'completed',
            inserted: result.inserted_count,
            duplicates: result.duplicate_count
          } : item
        ));

        setTotalStats(prev => ({
          inserted: prev.inserted + result.inserted_count,
          duplicates: prev.duplicates + result.duplicate_count
        }));

      } catch (error) {
        setImportProgress(prev => prev.map((item, index) => 
          index === i ? {
            ...item,
            status: 'error',
            error: (error as Error).message
          } : item
        ));
      }

      // Delay between requests
      if (i < allJobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsImporting(false);
  };

  const handleSearchImport = async () => {
    if (!searchQuery.trim() || !selectedCity) return;

    setIsImporting(true);
    const progressItem: ImportProgress = {
      city: selectedCity,
      category: `Search: ${searchQuery}`,
      status: 'processing',
      inserted: 0,
      duplicates: 0
    };

    setImportProgress([progressItem]);

    try {
      const result = await osmImporter.searchAndImport(searchQuery, selectedCity);
      
      setImportProgress([{
        ...progressItem,
        status: 'completed',
        inserted: result.inserted_count,
        duplicates: result.duplicate_count
      }]);

      setTotalStats(prev => ({
        inserted: prev.inserted + result.inserted_count,
        duplicates: prev.duplicates + result.duplicate_count
      }));

    } catch (error) {
      setImportProgress([{
        ...progressItem,
        status: 'error',
        error: (error as Error).message
      }]);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (status: ImportProgress['status']) => {
    switch (status) {
      case 'pending': return <RefreshCw className="w-4 h-4 text-gray-400" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ImportProgress['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-50 border-gray-200';
      case 'processing': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
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
            OpenStreetMap Data Collector
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Import real-world tourism data from OpenStreetMap for South African cities using Nominatim and Overpass APIs
          </p>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-6">Data Import Controls</h2>
          
          {/* Single Import */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF37]" />
                Single Category Import
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {categoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </div>
                
                <motion.button
                  onClick={handleSingleImport}
                  disabled={isImporting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#D4AF37] text-white py-3 rounded-lg font-medium hover:bg-[#B8941F] 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Import Category
                </motion.button>
              </div>
            </div>

            {/* Search Import */}
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Search Import
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., wine farms, safari lodges"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <motion.button
                  onClick={handleSearchImport}
                  disabled={isImporting || !searchQuery.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search & Import
                </motion.button>
              </div>
            </div>

            {/* Bulk Import */}
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Bulk Import All
              </h3>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Import all categories for all cities:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{cities.length} cities</li>
                    <li>{categories.length} categories each</li>
                    <li>~{cities.length * categories.length} total operations</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>This will take 10-15 minutes due to rate limiting</span>
                  </div>
                </div>
                
                <motion.button
                  onClick={handleBulkImport}
                  disabled={isImporting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Import All Data
                </motion.button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {(totalStats.inserted > 0 || totalStats.duplicates > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{totalStats.inserted}</div>
                <div className="text-sm text-green-700">Places Imported</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{totalStats.duplicates}</div>
                <div className="text-sm text-yellow-700">Duplicates Skipped</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((totalStats.inserted / (totalStats.inserted + totalStats.duplicates)) * 100) || 0}%
                </div>
                <div className="text-sm text-blue-700">Success Rate</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">FREE</div>
                <div className="text-sm text-purple-700">Data Source</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Progress Display */}
        {importProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-6">Import Progress</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {importProgress.map((item, index) => (
                <motion.div
                  key={`${item.city}-${item.category}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${getStatusColor(item.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium text-gray-900">{item.city}</span>
                    </div>
                    <span className="text-xs text-gray-600 capitalize">{item.status}</span>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-2">
                    {categoryLabels[item.category] || item.category}
                  </div>
                  
                  {item.status === 'completed' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">+{item.inserted} imported</span>
                      <span className="text-yellow-600">{item.duplicates} duplicates</span>
                    </div>
                  )}
                  
                  {item.status === 'error' && (
                    <div className="text-xs text-red-600 mt-2">
                      {item.error}
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
            <Globe className="w-5 h-5 text-[#D4AF37]" />
            OpenStreetMap Integration Info
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">Data Sources:</h4>
              <ul className="space-y-1">
                <li>• <strong>Nominatim API:</strong> Geocoding and search</li>
                <li>• <strong>Overpass API:</strong> Bulk POI extraction</li>
                <li>• <strong>Rate Limited:</strong> 1 request/second (respectful)</li>
                <li>• <strong>Coverage:</strong> All major SA cities</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Data Quality:</h4>
              <ul className="space-y-1">
                <li>• <strong>Duplicate Detection:</strong> Name + address/phone</li>
                <li>• <strong>Data Validation:</strong> Contact info normalization</li>
                <li>• <strong>Source Tracking:</strong> OSM attribution maintained</li>
                <li>• <strong>Quality Scoring:</strong> Automatic assessment</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OSMDataCollector;