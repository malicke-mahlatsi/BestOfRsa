import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, Flag, Camera, X, Filter } from 'lucide-react';
import { Review } from '../types';

interface ReviewSystemProps {
  venueId: string;
  reviews: Review[];
  averageRating: number;
  onWriteReview?: () => void;
}

interface RatingBreakdown {
  [key: number]: number;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ 
  venueId, 
  reviews, 
  averageRating,
  onWriteReview 
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null);

  // Calculate rating breakdown
  const ratingBreakdown: RatingBreakdown = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as RatingBreakdown);

  const totalReviews = reviews.length;

  // Sort and filter reviews
  const sortedAndFilteredReviews = reviews
    .filter(review => filterRating ? review.rating === filterRating : true)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

  const RatingBar: React.FC<{ stars: number; count: number; total: number }> = ({ stars, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1 w-12">
          <span className="text-sm font-medium">{stars}</span>
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 p-6 rounded-xl"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800 mb-2">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-gray-600">{totalReviews} reviews</div>
          </div>
          
          <div className="flex-1 w-full lg:w-auto">
            <h4 className="font-semibold mb-3">Rating Breakdown</h4>
            {[5, 4, 3, 2, 1].map(stars => (
              <RatingBar 
                key={stars} 
                stars={stars} 
                count={ratingBreakdown[stars] || 0} 
                total={totalReviews} 
              />
            ))}
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onWriteReview}
          className="mt-6 bg-[#D4AF37] text-white px-6 py-3 rounded-lg font-medium 
                   hover:bg-[#B8941F] transition-colors"
        >
          Write a Review
        </motion.button>
      </motion.div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
          
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {sortedAndFilteredReviews.length} of {totalReviews} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedAndFilteredReviews.map((review, index) => (
          <ReviewCard 
            key={review.id} 
            review={review} 
            index={index}
            onPhotoClick={setShowPhotoModal}
          />
        ))}
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPhotoModal(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPhotoModal(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={showPhotoModal}
                alt="Review photo"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ReviewCardProps {
  review: Review;
  index: number;
  onPhotoClick: (photo: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, index, onPhotoClick }) => {
  const [helpful, setHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);

  const handleHelpful = () => {
    if (!helpful) {
      setHelpful(true);
      setHelpfulCount(prev => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-gray-200 pb-6 last:border-b-0"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={review.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author)}&background=D4AF37&color=fff`}
            alt={review.author}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{review.author}</span>
              {review.verified && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {new Date(review.date).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
        
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      
      <p className="text-gray-700 leading-relaxed mb-4">{review.text}</p>
      
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {review.photos.map((photo, idx) => (
            <motion.img
              key={idx}
              whileHover={{ scale: 1.05 }}
              src={photo}
              alt={`Review photo ${idx + 1}`}
              className="w-20 h-20 object-cover rounded-lg cursor-pointer flex-shrink-0 border-2 border-transparent hover:border-[#D4AF37] transition-all"
              onClick={() => onPhotoClick(photo)}
            />
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleHelpful}
          className={`flex items-center gap-2 text-sm transition-colors ${
            helpful ? 'text-[#D4AF37]' : 'text-gray-600 hover:text-[#D4AF37]'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${helpful ? 'fill-current' : ''}`} />
          <span>Helpful ({helpfulCount})</span>
        </motion.button>
        
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
          <Flag className="w-4 h-4" />
          <span>Report</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ReviewSystem;