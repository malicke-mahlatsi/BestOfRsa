import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, Globe, X, RefreshCw } from 'lucide-react';

export const BulkImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}> = ({ isOpen, onClose, onImport }) => {
  const [importType, setImportType] = useState<'text' | 'csv' | 'osm'>('text');
  const [rawData, setRawData] = useState('');
  const [parsing, setParsing] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const cities = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Stellenbosch'];
  const categories = ['restaurants', 'hotels', 'attractions', 'activities'];

  const handleImport = async () => {
    setParsing(true);
    
    try {
      let parsed: any[] = [];
      
      if (importType === 'text') {
        // Parse text data - would integrate with PerplexityDataParser
        const lines = rawData.split('\n').filter(line => line.trim());
        parsed = lines.map((line, index) => ({
          id: `text-${index}`,
          name: line.trim(),
          source: 'manual_text'
        }));
      } else if (importType === 'csv') {
        // Parse CSV - would need CSV parser
        parsed = [];
      } else if (importType === 'osm') {
        // Trigger OSM import for selected cities/categories
        parsed = selectedCities.flatMap(city => 
          selectedCategories.map(category => ({
            id: `osm-${city}-${category}`,
            city,
            category,
            source: 'osm'
          }))
        );
      }
      
      onImport(parsed);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setParsing(false);
    }
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Bulk Import Data</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Import Type Selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setImportType('text')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                importType === 'text' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Text/AI Output
            </button>
            
            <button
              onClick={() => setImportType('csv')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                importType === 'csv' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              CSV File
            </button>
            
            <button
              onClick={() => setImportType('osm')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                importType === 'osm' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              OpenStreetMap
            </button>
          </div>

          {/* Import Content */}
          {importType === 'text' && (
            <div>
              <p className="text-gray-400 mb-3">
                Paste AI-generated content or structured text data
              </p>
              <textarea
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                className="w-full h-64 bg-slate-700 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your data here..."
              />
            </div>
          )}

          {importType === 'csv' && (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Drop CSV file here or click to browse</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer text-blue-400 hover:text-blue-300"
              >
                Choose File
              </label>
            </div>
          )}

          {importType === 'osm' && (
            <div className="space-y-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Select Cities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {cities.map(city => (
                    <label key={city} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedCities.includes(city)}
                        onChange={() => toggleCity(city)}
                        className="rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500" 
                      />
                      <span className="text-white">{city}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Select Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-500" 
                      />
                      <span className="text-white capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-500 font-medium">Rate Limited</p>
                    <p className="text-gray-400 text-sm">
                      OSM import respects rate limits (1 request/second). 
                      Full import may take 10-15 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleImport}
              disabled={parsing || (importType === 'text' && !rawData.trim()) || (importType === 'osm' && (selectedCities.length === 0 || selectedCategories.length === 0))}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {parsing && <RefreshCw className="w-4 h-4 animate-spin" />}
              Import Data
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};