import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { SearchFilters } from '../types';
import InstantSearch from './InstantSearch';
import { Listing } from '../types';

interface HeroSectionProps {
  listings: Listing[];
  onSearch: (filters: SearchFilters) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ listings, onSearch }) => {
  const [location, setLocation] = useState('');

  const handleSearch = (searchQuery: string) => {
    onSearch({
      searchQuery,
      location: location || undefined
    });
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c1824] via-[#16283e] to-[#1a2f47]" />
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg')] 
                     bg-cover bg-center opacity-20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#D4AF37]/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-cinzel font-bold text-white mb-6">
            Best<span className="text-[#D4AF37]">Of</span>RSA
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover South Africa's finest destinations, experiences, and hidden gems
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card ios-spacing-xl"
        >
          <div className="flex flex-col md:flex-row ios-gap-lg">
            <div className="flex-1">
              <InstantSearch
                listings={listings}
                onSearch={handleSearch}
                placeholder="What are you looking for?"
              />
            </div>
            
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/90 border border-gray-200 
                         focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all appearance-none"
              >
                <option value="">All Locations</option>
                <option value="Cape Town">Cape Town</option>
                <option value="Johannesburg">Johannesburg</option>
                <option value="Durban">Durban</option>
                <option value="Pretoria">Pretoria</option>
                <option value="Stellenbosch">Stellenbosch</option>
                <option value="Port Elizabeth">Port Elizabeth</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSearch({})}
              className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-white 
                       rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              Search
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center ios-gap-lg text-white/80"
        >
          <span className="text-sm">Popular searches:</span>
          {['Safari Tours', 'Wine Estates', 'Luxury Hotels', 'Table Mountain'].map((term) => (
            <motion.button
              key={term}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSearch(term)}
              className="glass-card px-3 py-1 text-sm hover:text-[#D4AF37] transition-all duration-300 cursor-pointer"
            >
              {term}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;