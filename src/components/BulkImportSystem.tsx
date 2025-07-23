import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Check, AlertTriangle, X, FileText, Database, Zap } from 'lucide-react';
import { PerplexityDataParser, ParsedBusiness } from '../utils/PerplexityDataParser';
import { DataValidator } from '../utils/DataValidator';
import { DuplicateDetector } from '../utils/DuplicateDetector';
import { Listing } from '../types';

interface ImportStatus {
  total: number;
  processed: number;
  successful: number;
  duplicates: number;
  errors: Array<{ index: number; error: string; business?: ParsedBusiness }>;
  warnings: Array<{ index: number; warning: string; business?: ParsedBusiness }>;
}

interface EnrichedBusiness extends ParsedBusiness {
  id: string;
  score: number;
  images: string[];
  amenities: string[];
  subcategory: string;
  coordinates: { lat: number; lng: number };
  operating_hours?: any;
  popular_times?: any;
}

const BulkImportSystem: React.FC = () => {
  const [importData, setImportData] = useState<ParsedBusiness[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('places-to-eat');
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    total: 0,
    processed: 0,
    successful: 0,
    duplicates: 0,
    errors: [],
    warnings: []
  });
  const [isImporting, setIsImporting] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedBusiness[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parser = new PerplexityDataParser();
  const validator = new DataValidator();
  const duplicateDetector = new DuplicateDetector();

  const categories = [
    { value: 'places-to-eat', label: 'Restaurants & Dining' },
    { value: 'places-to-stay', label: 'Hotels & Accommodation' },
    { value: 'things-to-do', label: 'Activities & Tours' },
    { value: 'places-to-visit', label: 'Attractions & Landmarks' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.type === 'application/json') {
          const jsonData = JSON.parse(content);
          setImportData(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } else {
          // Parse as text (from Perplexity)
          const parsed = parser.parseText(content);
          setImportData(parsed);
        }
        
        setShowPreview(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  const enrichBusinessData = (business: ParsedBusiness): EnrichedBusiness => {
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'Cape Town': { lat: -33.9249, lng: 18.4241 },
      'Johannesburg': { lat: -26.2041, lng: 28.0473 },
      'Durban': { lat: -29.8587, lng: 31.0218 },
      'Pretoria': { lat: -25.7479, lng: 28.2293 },
      'Stellenbosch': { lat: -33.9321, lng: 18.8602 },
      'Port Elizabeth': { lat: -33.9608, lng: 25.6022 }
    };

    const baseCoord = cityCoordinates[business.city] || cityCoordinates['Cape Town'];
    
    // Calculate score based on data completeness and quality
    let score = 6.0; // Base score
    if (business.phone) score += 0.5;
    if (business.email) score += 0.3;
    if (business.website) score += 0.4;
    if (business.rating > 0) {
      // Convert rating to our 10-point scale
      score = Math.min(10, (business.rating * 2) + 2);
    }
    if (business.confidence > 80) score += 0.5;
    
    // Generate category-specific data
    const subcategories: Record<string, string[]> = {
      'places-to-eat': ['Fine Dining', 'Casual Dining', 'Traditional', 'International', 'Street Food', 'Cafes'],
      'places-to-stay': ['Hotels', 'Safari Lodges', 'Guest Houses', 'Resorts', 'Boutique Hotels', 'B&Bs'],
      'things-to-do': ['Safari', 'Adventure Sports', 'Wine Tours', 'Cultural Tours', 'Water Sports', 'Nightlife'],
      'places-to-visit': ['Museums', 'Nature Reserves', 'Historical Sites', 'Beaches', 'National Parks', 'Monuments']
    };

    const categorySubcategories = subcategories[selectedCategory] || ['General'];
    const subcategory = categorySubcategories[Math.floor(Math.random() * categorySubcategories.length)];

    // Generate amenities based on category
    const amenitiesByCategory: Record<string, string[]> = {
      'places-to-eat': ['WiFi', 'Parking', 'Outdoor Seating', 'Wine Cellar', 'Private Dining', 'Live Music'],
      'places-to-stay': ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Gym', 'Concierge', 'Room Service'],
      'things-to-do': ['Professional Guides', 'Equipment Included', 'Transport', 'Photography', 'Refreshments', 'Safety Gear'],
      'places-to-visit': ['Guided Tours', 'Gift Shop', 'Parking', 'Wheelchair Access', 'Audio Guides', 'Cafe']
    };

    const categoryAmenities = amenitiesByCategory[selectedCategory] || ['WiFi', 'Parking'];
    const amenities = categoryAmenities.slice(0, Math.floor(Math.random() * 4) + 2);

    // Generate placeholder images
    const imageTemplates: Record<string, string[]> = {
      'places-to-eat': [
        'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      'places-to-stay': [
        'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3757144/pexels-photo-3757144.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      'things-to-do': [
        'https://images.pexels.com/photos/59989/elephant-herd-of-elephants-africa-wild-animals-59989.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      'places-to-visit': [
        'https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1570610/pexels-photo-1570610.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg?auto=compress&cs=tinysrgb&w=800'
      ]
    };

    const images = imageTemplates[selectedCategory] || imageTemplates['places-to-visit'];

    return {
      ...business,
      id: `${selectedCategory}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      score: Math.round(score * 10) / 10,
      images,
      amenities,
      subcategory,
      coordinates: {
        lat: baseCoord.lat + (Math.random() * 0.1 - 0.05),
        lng: baseCoord.lng + (Math.random() * 0.1 - 0.05)
      }
    };
  };

  const startImport = async () => {
    if (importData.length === 0) {
      alert('Please upload data first');
      return;
    }

    setIsImporting(true);
    setImportStatus({
      total: importData.length,
      processed: 0,
      successful: 0,
      duplicates: 0,
      errors: [],
      warnings: []
    });

    const enriched: EnrichedBusiness[] = [];
    const errors: Array<{ index: number; error: string; business?: ParsedBusiness }> = [];
    const warnings: Array<{ index: number; warning: string; business?: ParsedBusiness }> = [];

    for (let i = 0; i < importData.length; i++) {
      const business = importData[i];
      
      try {
        // Validate business data
        const validation = validator.validateBusiness(business);
        
        if (!validation.isValid) {
          errors.push({
            index: i,
            error: validation.errors.join(', '),
            business
          });
          continue;
        }

        // Check for duplicates
        const duplicates = duplicateDetector.findDuplicatesAgainstExisting(business, enriched);
        if (duplicates.length > 0) {
          setImportStatus(prev => ({ ...prev, duplicates: prev.duplicates + 1 }));
          warnings.push({
            index: i,
            warning: `Potential duplicate: ${duplicates[0].matchReasons.join(', ')}`,
            business
          });
          continue;
        }

        // Enrich and add business
        const enrichedBusiness = enrichBusinessData(business);
        enriched.push(enrichedBusiness);

        setImportStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          successful: prev.successful + 1
        }));

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          business
        });
      }

      setImportStatus(prev => ({ ...prev, processed: i + 1 }));
    }

    setImportStatus(prev => ({ ...prev, errors, warnings }));
    setEnrichedData(enriched);
    setIsImporting(false);
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(enrichedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bestrsa-import-${selectedCategory}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (type: 'successful' | 'duplicates' | 'errors') => {
    switch (type) {
      case 'successful': return 'text-green-400';
      case 'duplicates': return 'text-yellow-400';
      case 'errors': return 'text-red-400';
      default: return 'text-gray-400';
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
            Bulk Import System
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Import and process venue data with advanced validation, duplicate detection, and automatic enrichment
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Data Upload</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Category
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
                Upload Data File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-[#D4AF37]/30 rounded-lg 
                          hover:border-[#D4AF37]/50 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5 text-[#D4AF37]" />
                <span>Choose File (JSON, TXT, CSV)</span>
              </button>
            </div>
          </div>

          {importData.length > 0 && (
            <div className="mt-6 p-4 bg-[#0c1824]/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[#D4AF37]">
                  {importData.length} records loaded
                </span>
                <button
                  onClick={startImport}
                  disabled={isImporting}
                  className="px-6 py-2 bg-[#D4AF37] text-[#0c1824] font-medium rounded-lg 
                            hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-300 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0c1824]/30 border-t-[#0c1824] rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Start Import
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Progress Section */}
        {importStatus.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Import Progress</h2>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Progress</span>
                <span>{importStatus.processed} / {importStatus.total}</span>
              </div>
              <div className="w-full bg-[#0c1824]/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(importStatus.processed / importStatus.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0c1824]/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#D4AF37]">{importStatus.total}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
              <div className="bg-[#0c1824]/50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getStatusColor('successful')}`}>
                  {importStatus.successful}
                </div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              <div className="bg-[#0c1824]/50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getStatusColor('duplicates')}`}>
                  {importStatus.duplicates}
                </div>
                <div className="text-sm text-gray-400">Duplicates</div>
              </div>
              <div className="bg-[#0c1824]/50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getStatusColor('errors')}`}>
                  {importStatus.errors.length}
                </div>
                <div className="text-sm text-gray-400">Errors</div>
              </div>
            </div>

            {/* Results Actions */}
            {enrichedData.length > 0 && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={downloadResults}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg 
                            hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Results ({enrichedData.length} items)
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg 
                            hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Errors and Warnings */}
        {(importStatus.errors.length > 0 || importStatus.warnings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Issues Report</h2>
            
            {importStatus.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Errors ({importStatus.errors.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {importStatus.errors.map((error, idx) => (
                    <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-sm text-red-400">
                        <strong>Row {error.index + 1}:</strong> {error.error}
                      </div>
                      {error.business && (
                        <div className="text-xs text-gray-400 mt-1">
                          Business: {error.business.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importStatus.warnings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Warnings ({importStatus.warnings.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {importStatus.warnings.map((warning, idx) => (
                    <div key={idx} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-sm text-yellow-400">
                        <strong>Row {warning.index + 1}:</strong> {warning.warning}
                      </div>
                      {warning.business && (
                        <div className="text-xs text-gray-400 mt-1">
                          Business: {warning.business.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Preview Section */}
        {showPreview && enrichedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">
              Enriched Data Preview ({enrichedData.length} items)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {enrichedData.slice(0, 9).map((business, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#0c1824]/30 rounded-lg border border-[#D4AF37]/10"
                >
                  <h3 className="font-semibold text-[#D4AF37] mb-2">{business.name}</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div><span className="text-gray-400">Score:</span> {business.score}/10</div>
                    <div><span className="text-gray-400">Category:</span> {business.subcategory}</div>
                    <div><span className="text-gray-400">City:</span> {business.city}</div>
                    <div><span className="text-gray-400">Confidence:</span> {business.confidence}%</div>
                  </div>
                </div>
              ))}
            </div>
            
            {enrichedData.length > 9 && (
              <div className="mt-4 text-center text-gray-400">
                ... and {enrichedData.length - 9} more items
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BulkImportSystem;