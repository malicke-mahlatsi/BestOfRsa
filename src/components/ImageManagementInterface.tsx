import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Image, 
  Upload, 
  Download, 
  Check, 
  X, 
  ExternalLink, 
  Copy,
  Eye,
  Grid,
  Search,
  Globe,
  Camera
} from 'lucide-react';
import { ImageManagementSystem, ImageSource, ImageManifest } from '../utils/ImageManagementSystem';

const ImageManagementInterface: React.FC = () => {
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('Cape Town');
  const [category, setCategory] = useState('places-to-eat');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [imageResponse, setImageResponse] = useState('');
  const [parsedImages, setParsedImages] = useState<ImageSource[]>([]);
  const [socialProfiles, setSocialProfiles] = useState<Record<string, string>>({});
  const [imageManifest, setImageManifest] = useState<ImageManifest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const imageManager = new ImageManagementSystem();

  const locations = [
    'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 
    'Port Elizabeth', 'Stellenbosch', 'Knysna', 'Hermanus'
  ];

  const categories = [
    { value: 'places-to-eat', label: 'Restaurants' },
    { value: 'places-to-stay', label: 'Hotels' },
    { value: 'things-to-do', label: 'Activities' },
    { value: 'places-to-visit', label: 'Attractions' }
  ];

  const generatePrompt = () => {
    if (!venueName.trim()) {
      alert('Please enter a venue name');
      return;
    }

    const prompt = imageManager.generateImageSearchPrompt(venueName, location, category);
    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const parseImageData = async () => {
    if (!imageResponse.trim()) {
      alert('Please paste the Perplexity response');
      return;
    }

    setIsProcessing(true);

    try {
      const { directUrls, socialProfiles } = imageManager.parseImageUrls(imageResponse);
      
      // Validate URLs
      const validatedImages = await imageManager.validateImageUrls(directUrls);
      
      setParsedImages(validatedImages);
      setSocialProfiles(socialProfiles);

      // Generate placeholders for missing images
      const placeholders = imageManager.generateSmartPlaceholders({
        name: venueName,
        category: category.replace('places-to-', '').replace('things-to-', 'activity'),
        location,
        cuisine: 'modern' // Default cuisine
      });

      // Build image manifest
      const manifest = imageManager.buildImageManifest(
        { id: 'temp', name: venueName, category, location },
        {
          hero: validatedImages.find(img => img.category === 'hero')?.url,
          gallery: validatedImages.filter(img => img.category === 'gallery').map(img => img.url),
          directUrls,
          socialProfiles,
          validationStatus: 'validated' as const,
          gallerySize: 6
        }
      );

      setImageManifest(manifest);
    } catch (error) {
      console.error('Error parsing image data:', error);
      alert('Error parsing image data. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleImageSelection = (url: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(url)) {
      newSelection.delete(url);
    } else {
      newSelection.add(url);
    }
    setSelectedImages(newSelection);
  };

  const downloadManifest = () => {
    if (!imageManifest) return;

    const dataStr = JSON.stringify(imageManifest, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${venueName.replace(/\s+/g, '-').toLowerCase()}-images.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color?: string }> = 
    ({ label, value, icon, color = 'text-[#D4AF37]' }) => (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={color}>{icon}</div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
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
            Image URL Collection & Management
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Collect and manage high-quality images for South African venues with smart placeholder generation
          </p>
        </motion.div>

        {/* Prompt Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Generate Image Search Prompt</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Venue Name</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g., La Colombe Restaurant"
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generatePrompt}
            className="bg-[#D4AF37] text-[#0c1824] px-6 py-3 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-colors"
          >
            Generate Prompt
          </button>
        </motion.div>

        {/* Generated Prompt Display */}
        {generatedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#D4AF37]">Generated Image Search Prompt</h3>
              <button
                onClick={() => copyToClipboard(generatedPrompt)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap bg-[#0c1824]/50 p-4 rounded-lg border border-[#D4AF37]/20 text-gray-300">
              {generatedPrompt}
            </pre>
          </motion.div>
        )}

        {/* Image Response Parser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Parse Image URLs</h2>
          
          <textarea
            value={imageResponse}
            onChange={(e) => setImageResponse(e.target.value)}
            placeholder="Paste the Perplexity response with image URLs and social media links here..."
            className="w-full h-48 p-4 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white placeholder-gray-400 resize-none"
          />
          
          <button
            onClick={parseImageData}
            disabled={isProcessing}
            className="mt-4 bg-[#D4AF37] text-[#0c1824] px-6 py-3 rounded-lg font-medium hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0c1824]/30 border-t-[#0c1824] rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Parse & Validate URLs
              </>
            )}
          </button>
        </motion.div>

        {/* Results Display */}
        {imageManifest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cinzel text-[#D4AF37]">Image Collection Results</h2>
              <button
                onClick={downloadManifest}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Manifest
              </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Direct URLs Found"
                value={parsedImages.length}
                icon={<Image className="w-5 h-5" />}
              />
              <StatCard
                label="Social Profiles"
                value={Object.keys(socialProfiles).length}
                icon={<Globe className="w-5 h-5" />}
                color="text-blue-400"
              />
              <StatCard
                label="Total Images"
                value={imageManifest.metadata.total_images}
                icon={<Camera className="w-5 h-5" />}
                color="text-green-400"
              />
              <StatCard
                label="Placeholder %"
                value={imageManifest.metadata.placeholder_percentage}
                icon={<Grid className="w-5 h-5" />}
                color="text-orange-400"
              />
            </div>

            {/* Hero Image */}
            {imageManifest.images.hero && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Hero Image</h3>
                <div className="relative group">
                  <img
                    src={imageManifest.images.hero}
                    alt="Hero image"
                    className="w-full h-64 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => window.open(imageManifest.images.hero, '_blank')}
                      className="bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Full Size
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery Images */}
            {imageManifest.images.gallery.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Gallery Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageManifest.images.gallery.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => window.open(url, '_blank')}
                          className="bg-white text-black p-2 rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media Profiles */}
            {Object.keys(socialProfiles).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Social Media Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(socialProfiles).map(([platform, url]) => (
                    <div key={platform} className="bg-[#0c1824]/50 p-4 rounded-lg border border-[#D4AF37]/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-[#D4AF37]" />
                          <div>
                            <div className="font-semibold text-white capitalize">{platform}</div>
                            <div className="text-sm text-gray-400 truncate max-w-48">{url}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(url, '_blank')}
                          className="bg-[#D4AF37] text-[#0c1824] p-2 rounded-lg hover:bg-[#D4AF37]/90 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Manifest Preview */}
            <div className="bg-[#0c1824]/50 p-4 rounded-lg border border-[#D4AF37]/20">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">Image Manifest Preview</h3>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(imageManifest, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ImageManagementInterface;