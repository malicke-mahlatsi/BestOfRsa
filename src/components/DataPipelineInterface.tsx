import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Database,
  TrendingUp,
  Filter,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { DataPipeline, PipelineResult } from '../pipeline/DataPipeline';
import { BatchProcessor } from '../pipeline/BatchProcessor';

const DataPipelineInterface: React.FC = () => {
  const [inputData, setInputData] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('restaurant');
  const [pipelineOptions, setPipelineOptions] = useState({
    skipDuplicates: true,
    enrichAll: false,
    source: 'manual'
  });
  const [results, setResults] = useState<PipelineResult[]>([]);
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const pipeline = new DataPipeline();
  const batchProcessor = new BatchProcessor();

  const categories = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'tourist_attraction', label: 'Tourist Attraction' },
    { value: 'activity', label: 'Activity' }
  ];

  const processSingleItem = async () => {
    if (!inputData.trim()) {
      alert('Please enter data to process');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await pipeline.process(inputData, {
        skipDuplicateCheck: !pipelineOptions.skipDuplicates,
        skipEnhancement: !pipelineOptions.enrichAll,
        category: selectedCategory
      });

      setResults([result]);

      // If successful and not duplicate, save to database
      if (result.errors.length === 0 && (!result.isDuplicate || !pipelineOptions.skipDuplicates)) {
        const stats = await batchProcessor.processTextInput(inputData, {
          source: pipelineOptions.source,
          category: selectedCategory,
          skipDuplicates: pipelineOptions.skipDuplicates
        });

        console.log('Processing stats:', stats);
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert('Error processing data');
    } finally {
      setIsProcessing(false);
    }
  };

  const processBatchData = async () => {
    if (!inputData.trim()) {
      alert('Please enter data to process');
      return;
    }

    setIsProcessing(true);

    try {
      // Split input into lines and treat each as separate item
      const items = inputData.split('\n').filter(line => line.trim());
      
      const stats = await batchProcessor.processAndSave(items, {
        source: pipelineOptions.source,
        category: selectedCategory,
        skipDuplicates: pipelineOptions.skipDuplicates,
        enrichAll: pipelineOptions.enrichAll
      });

      setResults(stats.results);
      setProcessingStats(stats);
    } catch (error) {
      console.error('Batch processing error:', error);
      alert('Error processing batch data');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const StatCard: React.FC<{ 
    label: string; 
    value: number | string; 
    icon: React.ReactNode; 
    color?: string;
  }> = ({ label, value, icon, color = 'text-[#D4AF37]' }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`${color} p-3 rounded-lg bg-gray-50`}>{icon}</div>
        <div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
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
            Data Validation & Enrichment Pipeline
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Comprehensive data processing with validation, duplicate detection, and AI-powered content enhancement
          </p>
        </motion.div>

        {/* Configuration Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-cinzel text-[#D4AF37]">Pipeline Configuration</h2>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-[#D4AF37] hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Source</label>
              <input
                type="text"
                value={pipelineOptions.source}
                onChange={(e) => setPipelineOptions(prev => ({ ...prev, source: e.target.value }))}
                placeholder="e.g., perplexity, manual, scraping"
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white placeholder-gray-400"
              />
            </div>

            <div className="flex items-end">
              <div className="space-y-2 w-full">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={pipelineOptions.skipDuplicates}
                    onChange={(e) => setPipelineOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                    className="w-4 h-4 text-[#D4AF37] bg-transparent border-[#D4AF37] rounded focus:ring-[#D4AF37]"
                  />
                  Skip Duplicates
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={pipelineOptions.enrichAll}
                    onChange={(e) => setPipelineOptions(prev => ({ ...prev, enrichAll: e.target.checked }))}
                    className="w-4 h-4 text-[#D4AF37] bg-transparent border-[#D4AF37] rounded focus:ring-[#D4AF37]"
                  />
                  Full Enrichment
                </label>
              </div>
            </div>
          </div>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-[#0c1824]/30 p-4 rounded-lg border border-[#D4AF37]/20"
            >
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Advanced Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-medium mb-2">Pipeline Steps:</h4>
                  <ul className="space-y-1">
                    <li>• Data parsing and normalization</li>
                    <li>• Business rule validation</li>
                    <li>• Duplicate detection with fuzzy matching</li>
                    <li>• AI-powered content enhancement</li>
                    <li>• SEO optimization and tagging</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Quality Scoring:</h4>
                  <ul className="space-y-1">
                    <li>• Contact information completeness</li>
                    <li>• Address validation and geocoding</li>
                    <li>• Content quality assessment</li>
                    <li>• Image availability and quality</li>
                    <li>• Overall confidence scoring</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Data Input</h2>
          
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Paste your data here (Perplexity response, JSON, or plain text)..."
            className="w-full h-48 p-4 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white placeholder-gray-400 resize-none"
          />

          <div className="flex gap-4 mt-4">
            <motion.button
              onClick={processSingleItem}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#0c1824] font-medium rounded-lg hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0c1824]/30 border-t-[#0c1824] rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Process Single Item
                </>
              )}
            </motion.button>

            <motion.button
              onClick={processBatchData}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <Database className="w-5 h-5" />
              Process Batch
            </motion.button>

            {results.length > 0 && (
              <motion.button
                onClick={downloadResults}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-300"
              >
                <Download className="w-5 h-5" />
                Download Results
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Processing Statistics */}
        {processingStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          >
            <StatCard
              label="Processed"
              value={processingStats.processed}
              icon={<BarChart3 className="w-6 h-6" />}
              color="text-blue-600"
            />
            <StatCard
              label="Saved"
              value={processingStats.saved}
              icon={<CheckCircle className="w-6 h-6" />}
              color="text-green-600"
            />
            <StatCard
              label="Duplicates"
              value={processingStats.duplicates}
              icon={<Filter className="w-6 h-6" />}
              color="text-yellow-600"
            />
            <StatCard
              label="Errors"
              value={processingStats.errors}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="text-red-600"
            />
          </motion.div>
        )}

        {/* Results Display */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-6">Pipeline Results</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.validated.name || 'Unnamed Place'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {result.validated.address || 'No address provided'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                        {result.confidence}% confidence
                      </span>
                      
                      {result.isDuplicate && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          Duplicate
                        </span>
                      )}
                      
                      {result.enhanced && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          Enhanced
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Validation Results */}
                  {(result.errors.length > 0 || result.warnings.length > 0) && (
                    <div className="mb-4">
                      {result.errors.map((error, i) => (
                        <div key={i} className="flex items-center gap-2 text-red-600 text-sm mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          {error}
                        </div>
                      ))}
                      {result.warnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enhanced Content Preview */}
                  {result.enhanced && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Enhanced Content</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700">SEO Title:</div>
                          <div className="text-gray-600">{result.enhanced.seoData?.title}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Content Score:</div>
                          <div className="text-gray-600">{result.enhanced.contentScore}/100</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="font-medium text-gray-700">Generated Tags:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.enhanced.tags?.slice(0, 8).map((tag: string, i: number) => (
                              <span key={i} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DataPipelineInterface;