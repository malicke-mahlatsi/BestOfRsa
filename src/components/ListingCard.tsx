import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, DollarSign, Wifi, Car, Utensils, Heart } from 'lucide-react';
import { Listing } from '../types';
import ScoreBadge from './ScoreBadge';
import { useFavorites } from '../hooks/useFavorites';

interface ListingCardProps {
  listing: Listing;
  index: number;
  onViewDetails?: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, index, onViewDetails }) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'WiFi': <Wifi className="w-4 h-4" />,
      'Parking': <Car className="w-4 h-4" />,
      'Restaurant': <Utensils className="w-4 h-4" />,
      'Pool': <span className="text-sm">🏊</span>,
      'Spa': <span className="text-sm">💆</span>,
      'Bar': <span className="text-sm">🍸</span>,
    };
    return iconMap[amenity] || <Star className="w-4 h-4" />;
  };

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case '$': return 'text-green-600';
      case '$$': return 'text-yellow-600';
      case '$$$': return 'text-orange-600';
      case '$$$$': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="glass-card hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={listing.images[0]}
          alt={listing.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <ScoreBadge score={listing.score} />
        </div>
        <div className="absolute top-3 right-3 flex ios-gap-sm">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(listing.id);
            }}
            className={`p-2 rounded-full glass-card transition-colors ${
              isFavorite(listing.id) 
                ? 'bg-red-500 text-white' 
                : 'text-white/80 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite(listing.id) ? 'fill-current' : ''}`} />
          </motion.button>
          <span className="glass-card px-2 py-1 rounded-full text-xs font-medium text-white/90">
            {listing.subcategory}
          </span>
        </div>
        {listing.featured && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-[#D4AF37] text-[#0c1824] px-2 py-1 rounded-full text-xs font-bold">
              FEATURED
            </span>
          </div>
        )}
      </div>

      <div className="ios-spacing-lg bg-white/95 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-cinzel font-bold text-gray-900 line-clamp-1 flex-1">
            {listing.name}
          </h3>
          <div className={`ml-2 font-bold text-lg ${getPriceRangeColor(listing.price_range)}`}>
            {listing.price_range}
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3 text-gray-800">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{listing.location}</span>
        </div>

        <p className="text-gray-800 text-sm mb-4 line-clamp-2">
          {listing.description}
        </p>

        <div className="flex flex-wrap ios-gap-sm mb-4">
          {listing.amenities.slice(0, 4).map((amenity, index) => (
            <div
              key={index}
              className="flex items-center ios-gap-xs glass-card px-2 py-1 border border-gray-300"
              title={amenity}
            >
              {getAmenityIcon(amenity)}
              <span className="text-xs text-gray-900 font-semibold">{amenity}</span>
            </div>
          ))}
          {listing.amenities.length > 4 && (
            <div className="glass-card px-2 py-1 border border-gray-300">
              <span className="text-xs text-gray-900 font-semibold">+{listing.amenities.length - 4}</span>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onViewDetails?.(listing)}
          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-white py-2 rounded-lg 
                   font-medium hover:shadow-lg transition-all duration-300"
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ListingCard;