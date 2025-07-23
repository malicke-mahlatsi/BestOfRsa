import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Copy, 
  Download, 
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Users,
  ThumbsUp
} from 'lucide-react';
import { ReviewDataParser, ReviewData, ReviewSummary } from '../utils/ReviewDataParser';

const ReviewCollectionSystem: React.FC = () => {
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('Cape Town');
  const [promptType, setPromptType] = useState<'general' | 'detailed'>('general');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [reviewResponse, setReviewResponse] = useState('');
  const [parsedReviews, setParsedReviews] = useState<ReviewData[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const parser = new ReviewDataParser();

  const locations = [
    'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 
    'Port Elizabeth', 'Stellenbosch', 'Knysna', 'Hermanus'
  ];

  const promptTemplates = {
    general: `Find recent reviews and ratings for [VENUE_NAME] in [LOCATION], South Africa. Include:
- Overall rating scores from Google, TripAdvisor, Facebook
- 5 recent positive reviews with key points
- 3 constructive/negative reviews if available
- Most mentioned positive aspects
- Common complaints or issues
- Best time to visit according to reviews
- Popular dishes/features mentioned by customers

Format each review with the reviewer's sentiment and main points clearly highlighted.`,

    detailed: `Analyze comprehensive customer feedback for [VENUE_NAME] in [LOCATION], South Africa:
- Service quality mentions and staff interactions
- Food/accommodation quality feedback with specific details
- Value for money comments and pricing feedback
- Atmosphere/ambiance descriptions and mood
- Specific dish/room/feature recommendations
- Staff member mentions (positive and constructive)
- Accessibility and facility feedback
- Repeat customer experiences

Format each review with sentiment analysis and extract key themes that customers consistently mention.`
  };

  const generatePrompt = () => {
    if (!venueName.trim()) {
      alert('Please enter a venue name');
      return;
    }

    const template = promptTemplates[promptType];
    const prompt = template
      .replace('[VENUE_NAME]', venueName)
      .replace('[LOCATION]', location);
    
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

  const parseAndAnalyzeReviews = () => {
    if (!reviewResponse.trim()) {
      alert('Please paste the Perplexity response');
      return;
    }

    setIsProcessing(true);

    try {
      const reviews = parser.parseReviewResponse(reviewResponse, venueName);
      const summary = parser.aggregateReviewData(reviews);
      
      setParsedReviews(reviews);
      setReviewSummary(summary);
    } catch (error) {
      console.error('Error parsing reviews:', error);
      alert('Error parsing reviews. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReviewData = () => {
    const data = {
      venue_name: venueName,
      location,
      summary: reviewSummary,
      reviews: parsedReviews,
      generated_at: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${venueName.replace(/\s+/g, '-').toLowerCase()}-reviews-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'very_positive': return 'text-green-600 bg-green-100';
      case 'positive': return 'text-green-500 bg-green-50';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      case 'negative': return 'text-orange-500 bg-orange-50';
      case 'very_negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const StatCard: React.FC<{ label: string; value: string | number; suffix?: string; icon: React.ReactNode }> = 
    ({ label, value, suffix = '', icon }) => (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="text-[#D4AF37]">{icon}</div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{value}{suffix}</div>
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
            Review Data Collection System
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Generate optimized Perplexity prompts to collect comprehensive review data with sentiment analysis and authenticity scoring
          </p>
        </motion.div>

        {/* Prompt Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Generate Review Collection Prompt</h2>
          
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Prompt Type</label>
              <select
                value={promptType}
                onChange={(e) => setPromptType(e.target.value as 'general' | 'detailed')}
                className="w-full p-3 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white"
              >
                <option value="general">General Reviews</option>
                <option value="detailed">Detailed Analysis</option>
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
              <h3 className="text-lg font-semibold text-[#D4AF37]">Generated Prompt</h3>
              <button
                onClick={() => copyToClipboard(generatedPrompt)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap bg-[#0c1824]/50 p-4 rounded-lg border border-[#D4AF37]/20 text-gray-300">
              {generatedPrompt}
            </pre>
          </motion.div>
        )}

        {/* Review Response Parser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20 mb-8"
        >
          <h2 className="text-2xl font-cinzel text-[#D4AF37] mb-4">Parse Review Data</h2>
          
          <textarea
            value={reviewResponse}
            onChange={(e) => setReviewResponse(e.target.value)}
            placeholder="Paste the Perplexity response with review data here..."
            className="w-full h-48 p-4 bg-[#0c1824]/50 border border-[#D4AF37]/30 rounded-lg text-white placeholder-gray-400 resize-none"
          />
          
          <button
            onClick={parseAndAnalyzeReviews}
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
                <TrendingUp className="w-4 h-4" />
                Parse & Analyze Reviews
              </>
            )}
          </button>
        </motion.div>

        {/* Review Analysis Results */}
        {reviewSummary && parsedReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A2A44]/30 p-6 rounded-xl border border-[#D4AF37]/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cinzel text-[#D4AF37]">Review Analysis Results</h2>
              <button
                onClick={downloadReviewData}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Data
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Reviews"
                value={reviewSummary.total_reviews}
                icon={<MessageSquare className="w-5 h-5" />}
              />
              <StatCard
                label="Average Rating"
                value={reviewSummary.average_rating}
                suffix="/5"
                icon={<Star className="w-5 h-5" />}
              />
              <StatCard
                label="Authenticity Score"
                value={reviewSummary.authenticity_average}
                suffix="%"
                icon={<CheckCircle className="w-5 h-5" />}
              />
              <StatCard
                label="Positive Sentiment"
                value={Math.round(((reviewSummary.sentiment_summary.positive || 0) + (reviewSummary.sentiment_summary.very_positive || 0)) / reviewSummary.total_reviews * 100)}
                suffix="%"
                icon={<ThumbsUp className="w-5 h-5" />}
              />
            </div>

            {/* Rating Breakdown */}
            <div className="bg-white p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Breakdown</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = reviewSummary.rating_breakdown[rating] || 0;
                  const percentage = reviewSummary.total_reviews > 0 ? (count / reviewSummary.total_reviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Mentions */}
            <div className="bg-white p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Mentions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(reviewSummary.popular_mentions).map(([category, mentions]) => (
                  <div key={category} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2 capitalize">{category}</h4>
                    <div className="space-y-1">
                      {mentions.slice(0, 5).map(({ item, count }) => (
                        <div key={item} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item}</span>
                          <span className="text-gray-500">({count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Parsed Reviews ({parsedReviews.length})</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {parsedReviews.map((review, index) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-800">{review.author}</div>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        {review.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(review.sentiment)}`}>
                          {review.sentiment.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {review.authenticity_score}% authentic
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{review.text}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(review.date).toLocaleDateString()}</span>
                      <span>{review.source}</span>
                      <span>{review.helpful_count} helpful</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReviewCollectionSystem;