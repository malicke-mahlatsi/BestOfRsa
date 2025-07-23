import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
}

const StarRating = ({ rating, maxRating = 5 }: StarRatingProps) => {
  // Round to nearest half
  const roundedRating = Math.round(rating * 2) / 2;
  
  return (
    <div className="flex items-center gap-1 mb-2">
      {[...Array(maxRating)].map((_, i) => {
        // Determine if this star should be filled, half-filled, or empty
        const starFill = i < Math.floor(roundedRating) 
          ? "text-[#D4AF37]" // Filled
          : i < roundedRating 
            ? "text-[#D4AF37]/70" // Half-filled (we'll use opacity for half)
            : "text-gray-400"; // Empty
            
        return (
          <Star 
            key={i} 
            size={16} 
            className={`${starFill} transition-colors duration-300`} 
            fill={i < Math.floor(roundedRating) ? "currentColor" : (i < roundedRating ? "currentColor" : "none")}
          />
        );
      })}
      <span className="text-sm text-white ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;