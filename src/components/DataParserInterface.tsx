import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Check, AlertTriangle, X, Eye } from 'lucide-react';
import { PerplexityDataParser, ParsedBusiness, ValidationResult } from '../utils/PerplexityDataParser';

interface ParsedBusinessWithValidation extends ParsedBusiness {
  validation: ValidationResult;
  selected: boolean;
}

const DataParserInterface: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedBusinessWithValidation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const parser = new PerplexityDataParser();

  const handleParse = async () => {
    if (!inputText.trim()) {
      setMessage({ type: 'error', text: 'Please enter some text to parse' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const businesses = parser.parseText(inputText);
      const businessesWithValidation = businesses.map(business => ({
        ...business,
        validation: parser.validateBusiness(business),
        selected: business.confidence >= 70 // Auto-select high confidence items
      }));

      setParsedData(businessesWithValidation);
      setShowPreview(true);
      setMessage({ 
        type: 'success', 
        text: `Successfully parsed ${businesses.length} business${businesses.length !== 1 ? 'es' : ''}` 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Error parsing data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleBusinessSelection = (index: number) => {
    setParsedData(prev => prev.map((business, i) => 
      i === index ? { ...business, selected: !business.selected } : business
    ));
  };

  const exportToJSON = () => {
    const selectedBusinesses = parsedData.filter(b => b.selected);
    const dataStr = JSON.stringify(selectedBusinesses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parsed-businesses-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
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
            Perplexity Data Parser
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Paste Perplexity AI responses to automatically extract and structure business data for BestOfRSA
          </p>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : message.type === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Input Data</h2>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste Perplexity AI response here..."
              className="w-full h-64 p-4 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg 
                        text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-[#D4AF37] 
                        focus:border-transparent"
            />

            <div className="flex gap-4 mt-4">
              <motion.button
                onClick={handleParse}
                disabled={isProcessing || !inputText.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#D4AF37] 
                          text-[#0c1824] font-medium rounded-lg hover:bg-[#D4AF37]/90 
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0c1824]/30 border-t-[#0c1824] rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Parse Data
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => setShowPreview(!showPreview)}
                disabled={parsedData.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-[#1A2A44]/50 border border-[#D4AF37]/30 text-[#D4AF37] 
                          rounded-lg hover:bg-[#1A2A44]/80 disabled:opacity-50 disabled:cursor-not-allowed 
                          transition-all duration-300"
              >
                <Eye className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Statistics Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Parse Statistics</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0c1824]/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#D4AF37]">{parsedData.length}</div>
                <div className="text-sm text-gray-400">Total Parsed</div>
              </div>
              
              <div className="bg-[#0c1824]/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {parsedData.filter(b => b.validation.isValid).length}
                </div>
                <div className="text-sm text-gray-400">Valid</div>
              </div>
              
              <div className="bg-[#0c1824]/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {parsedData.filter(b => b.selected).length}
                </div>
                <div className="text-sm text-gray-400">Selected</div>
              </div>
              
              <div className="bg-[#0c1824]/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {parsedData.filter(b => b.confidence >= 80).length}
                </div>
                <div className="text-sm text-gray-400">High Confidence</div>
              </div>
            </div>

            {parsedData.length > 0 && (
              <motion.button
                onClick={exportToJSON}
                disabled={parsedData.filter(b => b.selected).length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-green-600 
                          text-white font-medium rounded-lg hover:bg-green-700 
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <Download className="w-5 h-5" />
                Download JSON
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Preview Section */}
        {showPreview && parsedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-6">Parsed Data Preview</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {parsedData.map((business, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    business.selected 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' 
                      : 'bg-[#0c1824]/30 border-[#D4AF37]/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={business.selected}
                          onChange={() => toggleBusinessSelection(index)}
                          className="w-4 h-4 text-[#D4AF37] bg-transparent border-[#D4AF37] rounded 
                                    focus:ring-[#D4AF37] focus:ring-2"
                        />
                        <h3 className="text-lg font-semibold text-[#D4AF37]">{business.name}</h3>
                        <span className={`text-sm font-medium ${getConfidenceColor(business.confidence)}`}>
                          {business.confidence}% confidence
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                        {business.category && (
                          <div><span className="text-gray-400">Category:</span> {business.category}</div>
                        )}
                        {business.phone && (
                          <div><span className="text-gray-400">Phone:</span> {business.phone}</div>
                        )}
                        {business.email && (
                          <div><span className="text-gray-400">Email:</span> {business.email}</div>
                        )}
                        {business.website && (
                          <div><span className="text-gray-400">Website:</span> {business.website}</div>
                        )}
                        {business.address && (
                          <div className="md:col-span-2"><span className="text-gray-400">Address:</span> {business.address}</div>
                        )}
                        {business.description && (
                          <div className="md:col-span-2"><span className="text-gray-400">Description:</span> {business.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {business.validation.isValid ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                      
                      {business.validation.warnings.length > 0 && (
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                  </div>

                  {(business.validation.errors.length > 0 || business.validation.warnings.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/20">
                      {business.validation.errors.map((error, i) => (
                        <div key={i} className="text-sm text-red-400 flex items-center gap-2">
                          <X className="w-4 h-4" />
                          {error}
                        </div>
                      ))}
                      {business.validation.warnings.map((warning, i) => (
                        <div key={i} className="text-sm text-yellow-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {warning}
                        </div>
                      ))}
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

export default DataParserInterface;