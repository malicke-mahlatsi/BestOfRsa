import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Clock, 
  Star,
  Heart,
  Share2,
  Calendar,
  Users,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react';
import { Listing } from '../types';
import ScoreBadge from './ScoreBadge';
import ReviewSystem from './ReviewSystem';
import ShareButtons from './ShareButtons';
import CategorySpecificFeatures from './CategorySpecificFeatures';
import { useFavorites } from '../hooks/useFavorites';

interface VenueDetailPageProps {
  venue: Listing;
  onBack: () => void;
}

const VenueDetailPage: React.FC<VenueDetailPageProps> = ({ venue, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'location' | 'contact'>('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<keyof typeof venue.popular_times>('Mon');
  const { isFavorite, toggleFavorite } = useFavorites();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
    { id: 'location', label: 'Location', icon: '📍' },
    { id: 'contact', label: 'Contact', icon: '📞' }
  ] as const;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venue.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venue.images.length) % venue.images.length);
  };

  const getCurrentStatus = () => {
    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentHour = now.getHours();
    
    if (!venue.operating_hours) return { status: 'Unknown', color: 'text-gray-500' };
    
    const todayHours = venue.operating_hours[currentDay as keyof typeof venue.operating_hours];
    
    if (todayHours === 'Closed') {
      return { status: 'Closed', color: 'text-red-500' };
    }
    
    // Parse hours (simplified)
    const [openTime, closeTime] = todayHours.split(' to ');
    const openHour = parseInt(openTime.split(':')[0]);
    const closeHour = parseInt(closeTime.split(':')[0]);
    
    if (currentHour >= openHour && currentHour < closeHour) {
      return { status: 'Open Now', color: 'text-green-500' };
    }
    
    return { status: 'Closed', color: 'text-red-500' };
  };

  const status = getCurrentStatus();

  const renderPopularTimesChart = () => {
    if (!venue.popular_times) return null;
    
    const dayData = venue.popular_times[selectedDay];
    const maxValue = Math.max(...dayData);
    
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-cinzel font-bold mb-4">Popular Times</h3>
        
        {/* Day selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {Object.keys(venue.popular_times).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day as keyof typeof venue.popular_times)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDay === day
                  ? 'bg-[#D4AF37] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        
        {/* Chart */}
        <div className="flex items-end gap-1 h-32">
          {dayData.map((value, hour) => (
            <div key={hour} className="flex-1 flex flex-col items-center">
              <div
                className="bg-[#D4AF37] rounded-t transition-all duration-300 hover:bg-[#B8941F] w-full"
                style={{ height: `${(value / maxValue) * 100}%` }}
                title={`${hour}:00 - ${value}% busy`}
              />
              <span className="text-xs text-gray-500 mt-1">
                {hour === 0 ? '12a' : hour <= 12 ? `${hour}${hour === 12 ? 'p' : 'a'}` : `${hour - 12}p`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-black">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <ScoreBadge score={venue.score} size="lg" />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleFavorite(venue.id)}
            className={`p-2 rounded-full transition-colors ${
              isFavorite(venue.id) 
                ? 'bg-red-500 text-white' 
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-6 h-6 ${isFavorite(venue.id) ? 'fill-current' : ''}`} />
          </motion.button>
          <div className="bg-black/50 rounded-full">
            <ShareButtons venue={venue} />
          </div>
        </div>

        {/* Image Carousel */}
        <div className="relative w-full h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={venue.images[currentImageIndex]}
              alt={`${venue.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
          
          {venue.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          {/* Image indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {venue.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info Header */}
      <div className="bg-white shadow-lg -mt-10 relative z-10 mx-4 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-cinzel font-bold text-[#1a1a1a] mb-2">{venue.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-800 mb-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{venue.location}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-gray-900">{venue.subcategory}</span>
              <span>•</span>
              <span className="font-bold text-lg text-[#D4AF37]">{venue.price_range}</span>
              <span>•</span>
              <span className={`font-medium ${status.color}`}>
                <Clock className="w-4 h-4 inline mr-1" />
                {status.status}
              </span>
            </div>
            
            {venue.highlights && (
              <div className="flex flex-wrap gap-2">
                {venue.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 border border-green-300"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {highlight}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#D4AF37] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#B8941F] transition-colors flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-[#D4AF37] text-[#D4AF37] px-6 py-3 rounded-lg font-medium hover:bg-[#D4AF37] hover:text-white transition-colors flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#D4AF37] text-[#D4AF37]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-cinzel font-bold mb-4">About</h3>
                      <p className="text-gray-600 leading-relaxed">{venue.detailed_description}</p>
                    </div>

                    {/* Amenities */}
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-cinzel font-bold mb-4">Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {venue.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-gray-600">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category-Specific Features */}
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-cinzel font-bold mb-4">
                        {venue.category === 'places-to-eat' && 'Restaurant Details'}
                        {venue.category === 'places-to-stay' && 'Hotel Information'}
                        {venue.category === 'things-to-do' && 'Activity Details'}
                        {venue.category === 'places-to-visit' && 'Attraction Information'}
                      </h3>
                      <CategorySpecificFeatures listing={venue} />
                    </div>

                    {/* Popular Times */}
                    {renderPopularTimesChart()}
                  </div>

                  <div className="space-y-6">
                    {/* Operating Hours */}
                    {venue.operating_hours && (
                      <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h3 className="text-xl font-cinzel font-bold mb-4">Operating Hours</h3>
                        <div className="space-y-2">
                          {Object.entries(venue.operating_hours).map(([day, hours]) => (
                            <div key={day} className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">{day}</span>
                              <span className="text-gray-600">{hours}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Info */}
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-cinzel font-bold mb-4">Quick Info</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-[#D4AF37]" />
                          <span className="text-gray-600">{venue.address}</span>
                        </div>
                        {venue.contact?.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-[#D4AF37]" />
                            <span className="text-gray-600">{venue.contact.phone}</span>
                          </div>
                        )}
                        {venue.contact?.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-[#D4AF37]" />
                            <a href={venue.contact.website} className="text-[#D4AF37] hover:underline">
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ReviewSystem
                  venueId={venue.id}
                  reviews={venue.reviews || []}
                  averageRating={venue.score / 2} // Convert 10-point to 5-point scale
                  onWriteReview={() => {
                    // TODO: Implement write review modal
                    console.log('Write review for', venue.name);
                  }}
                />
              )}

              {activeTab === 'location' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-cinzel font-bold mb-4">Location</h3>
                      <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto mb-2" />
                          <p>Interactive Map</p>
                          <p className="text-sm">Lat: {venue.coordinates?.lat.toFixed(4)}</p>
                          <p className="text-sm">Lng: {venue.coordinates?.lng.toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-cinzel font-bold mb-4">Address</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-[#D4AF37] mt-1" />
                          <div>
                            <p className="font-medium text-gray-800">{venue.name}</p>
                            <p className="text-gray-600">{venue.address}</p>
                            <p className="text-gray-600">{venue.location}</p>
                          </div>
                        </div>
                      </div>
                      <button className="w-full mt-4 bg-[#D4AF37] text-white py-2 rounded-lg hover:bg-[#B8941F] transition-colors">
                        Get Directions
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-cinzel font-bold mb-6">Contact Information</h3>
                    <div className="space-y-4">
                      {venue.contact?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-[#D4AF37]" />
                          <div>
                            <p className="font-medium">Phone</p>
                            <a href={`tel:${venue.contact.phone}`} className="text-[#D4AF37] hover:underline">
                              {venue.contact.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {venue.contact?.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-[#D4AF37]" />
                          <div>
                            <p className="font-medium">Email</p>
                            <a href={`mailto:${venue.contact.email}`} className="text-[#D4AF37] hover:underline">
                              {venue.contact.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {venue.contact?.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-[#D4AF37]" />
                          <div>
                            <p className="font-medium">Website</p>
                            <a href={venue.contact.website} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
                              Visit Website
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {venue.contact?.social && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium mb-4">Follow Us</h4>
                        <div className="flex gap-3">
                          {venue.contact.social.facebook && (
                            <a href={venue.contact.social.facebook} className="text-blue-600 hover:text-blue-700">
                              <Facebook className="w-6 h-6" />
                            </a>
                          )}
                          {venue.contact.social.instagram && (
                            <a href={venue.contact.social.instagram} className="text-pink-600 hover:text-pink-700">
                              <Instagram className="w-6 h-6" />
                            </a>
                          )}
                          {venue.contact.social.twitter && (
                            <a href={venue.contact.social.twitter} className="text-blue-400 hover:text-blue-500">
                              <Twitter className="w-6 h-6" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-cinzel font-bold mb-6">Send a Message</h3>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                          placeholder="Your message..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#D4AF37] text-white py-2 rounded-lg hover:bg-[#B8941F] transition-colors"
                      >
                        Send Message
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailPage;