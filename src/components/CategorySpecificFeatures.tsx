import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Users, 
  Star, 
  Utensils, 
  Wifi, 
  Car, 
  Waves, 
  Dumbbell, 
  Coffee,
  Shield,
  Camera,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Listing } from '../types';

interface CategorySpecificFeaturesProps {
  listing: Listing;
}

const CategorySpecificFeatures: React.FC<CategorySpecificFeaturesProps> = ({ listing }) => {
  const renderRestaurantFeatures = () => {
    if (!listing.restaurant_data) return null;

    const { cuisines, dietary_options, popular_dishes, average_meal_price, dress_code, reservations_required } = listing.restaurant_data;

    const dietaryIcons: Record<string, string> = {
      'Vegetarian': '🥬',
      'Vegan': '🌱',
      'Gluten-Free': '🌾',
      'Halal': '☪️',
      'Kosher': '✡️'
    };

    return (
      <div className="space-y-6">
        {/* Cuisine Tags */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#D4AF37]" />
            Cuisine Type
          </h4>
          <div className="flex flex-wrap gap-2">
            {cuisines.map(cuisine => (
              <span key={cuisine} className="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full text-sm font-medium">
                {cuisine}
              </span>
            ))}
          </div>
        </div>

        {/* Dietary Options */}
        <div>
          <h4 className="font-semibold mb-3">Dietary Options</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dietary_options.map(option => (
              <div key={option} className="text-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl mb-1 block">{dietaryIcons[option] || '🍽️'}</span>
                <div className="text-xs font-medium">{option}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Dishes */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#D4AF37]" />
            Popular Dishes
          </h4>
          <div className="space-y-3">
            {popular_dishes.map(dish => (
              <div key={dish.name} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{dish.name}</div>
                  {dish.description && (
                    <div className="text-sm text-gray-700 mt-1">{dish.description}</div>
                  )}
                </div>
                <div className="font-bold text-[#B8941F] ml-4 text-lg">R{dish.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm text-gray-600">Average Price</div>
            <div className="font-semibold">{average_meal_price}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">👔</div>
            <div className="text-sm text-gray-600">Dress Code</div>
            <div className="font-semibold">{dress_code}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm text-gray-600">Reservations</div>
            <div className="font-semibold">{reservations_required ? 'Required' : 'Recommended'}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderHotelFeatures = () => {
    if (!listing.hotel_data) return null;

    const { star_rating, room_types, hotel_amenities, check_in, check_out, cancellation_policy } = listing.hotel_data;

    const amenityIcons: Record<string, React.ReactNode> = {
      'WiFi': <Wifi className="w-5 h-5" />,
      'Pool': <Waves className="w-5 h-5" />,
      'Gym': <Dumbbell className="w-5 h-5" />,
      'Spa': <span className="text-lg">🧖</span>,
      'Restaurant': <Utensils className="w-5 h-5" />,
      'Bar': <span className="text-lg">🍷</span>,
      'Business Center': <span className="text-lg">💼</span>,
      'Pet Friendly': <span className="text-lg">🐕</span>,
      'Airport Shuttle': <span className="text-lg">🚐</span>,
      'Parking': <Car className="w-5 h-5" />,
      'Concierge': <span className="text-lg">🛎️</span>,
      'Room Service': <Coffee className="w-5 h-5" />
    };

    return (
      <div className="space-y-6">
        {/* Star Rating */}
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Hotel Rating:</h4>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < star_rating ? 'text-[#D4AF37] fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({star_rating} Star Hotel)</span>
        </div>

        {/* Room Types */}
        <div>
          <h4 className="font-semibold mb-4">Room Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room_types.map(room => (
              <motion.div 
                key={room.type} 
                whileHover={{ scale: 1.02 }}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                <img src={room.image} className="w-full h-40 object-cover" alt={room.type} />
                <div className="p-4">
                  <h5 className="font-semibold text-lg">{room.type}</h5>
                  <p className="text-sm text-gray-600 mb-2">{room.size} • {room.beds}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.map(amenity => (
                      <span key={amenity} className="bg-gray-100 text-xs px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-[#D4AF37] text-lg">From R{room.price}</div>
                    <div className="text-sm text-gray-600">/night</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hotel Amenities */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4">Hotel Amenities</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {hotel_amenities.map(amenity => (
              <div key={amenity} className="flex items-center gap-2 p-2">
                <div className="text-[#D4AF37]">
                  {amenityIcons[amenity] || <CheckCircle className="w-5 h-5" />}
                </div>
                <span className="text-sm text-gray-900 font-medium">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Check-in/Check-out */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Check-in</div>
            <div className="font-semibold">{check_in}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Check-out</div>
            <div className="font-semibold">{check_out}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Shield className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Cancellation</div>
            <div className="font-semibold text-xs">{cancellation_policy}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderActivityFeatures = () => {
    if (!listing.activity_data) return null;

    const { duration, group_size, difficulty, age_restriction, included, highlights, requirements, best_time } = listing.activity_data;

    const difficultyColors = {
      'Easy': 'text-green-600 bg-green-100',
      'Moderate': 'text-yellow-600 bg-yellow-100',
      'Challenging': 'text-orange-600 bg-orange-100',
      'Expert': 'text-red-600 bg-red-100'
    };

    return (
      <div className="space-y-6">
        {/* Key Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Duration</div>
            <div className="font-semibold">{duration}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Group Size</div>
            <div className="font-semibold">{group_size}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Award className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Difficulty</div>
            <div className={`font-semibold px-2 py-1 rounded text-xs ${difficultyColors[difficulty]}`}>
              {difficulty}
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Age Limit</div>
            <div className="font-semibold">{age_restriction}</div>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-green-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            What's Included
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {included.map(item => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-blue-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            Experience Highlights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {highlights.map(highlight => (
              <div key={highlight} className="flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-orange-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            What to Bring
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {requirements.map(requirement => (
              <div key={requirement} className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span className="text-sm">{requirement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Best Time */}
        <div className="text-center p-4 bg-white border border-gray-300 rounded-lg">
          <Calendar className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
          <div className="text-sm text-gray-700 font-medium">Best Time</div>
          <div className="font-bold text-gray-900">{best_time}</div>
        </div>
      </div>
    );
  };

  const renderAttractionFeatures = () => {
    if (!listing.attraction_data) return null;

    const { ticket_prices, best_time_to_visit, estimated_duration, accessibility, facilities, guided_tours_available, photography_allowed } = listing.attraction_data;

    return (
      <div className="space-y-6">
        {/* Ticket Prices */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🎫</span>
            Ticket Prices
          </h4>
          <div className="space-y-3">
            {ticket_prices.map(ticket => (
              <div key={ticket.type} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{ticket.type}</div>
                  {ticket.description && (
                    <div className="text-sm text-gray-600">{ticket.description}</div>
                  )}
                </div>
                <div className="font-bold text-[#D4AF37]">R{ticket.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Duration</div>
            <div className="font-semibold">{estimated_duration}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Best Time</div>
            <div className="font-semibold">{best_time_to_visit}</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Camera className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <div className="text-sm text-gray-600">Photography</div>
            <div className="font-semibold">{photography_allowed ? 'Allowed' : 'Restricted'}</div>
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-blue-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Facilities
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {facilities.map(facility => (
              <div key={facility} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm">{facility}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="bg-green-50 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Accessibility
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {accessibility.map(feature => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Guided Tours */}
        <div className="text-center p-4 bg-white border border-gray-300 rounded-lg">
          <Calendar className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
          <div className="text-sm text-gray-700 font-medium">Guided Tours</div>
          <div className="font-bold text-gray-900">{guided_tours_available ? 'Available' : 'Self-guided only'}</div>
        </div>
      </div>
    );
  };

  // Determine which features to render based on category
  const renderFeatures = () => {
    switch (listing.category) {
      case 'places-to-eat':
        return renderRestaurantFeatures();
      case 'places-to-stay':
        return renderHotelFeatures();
      case 'things-to-do':
        return renderActivityFeatures();
      case 'places-to-visit':
        return renderAttractionFeatures();
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {renderFeatures()}
    </motion.div>
  );
};

export default CategorySpecificFeatures;