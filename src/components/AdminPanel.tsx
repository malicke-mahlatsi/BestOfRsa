import React, { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';

const AdminPanel: React.FC = () => {
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [radius, setRadius] = useState('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch_places`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location,
            type,
            radius: parseInt(radius)
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch places');
      }

      setMessage('Places fetched and stored successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 max-w-4xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-cinzel text-center mb-12 text-[#D4AF37]"
      >
        Admin Panel
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-[#1A2A44]/30 p-8 rounded-xl border border-[#D4AF37]/20 backdrop-blur-sm"
      >
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-center"
          >
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-lg bg-red-500/20 text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#F5F5F5]/80 mb-2" htmlFor="location">
              Location (lat,lng)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., -33.9249,18.4241"
              className="w-full px-4 py-3 rounded-lg bg-[#1A2A44]/80 border-2 border-[#D4AF37]/30 
                        text-[#F5F5F5] placeholder-gray-400 focus:ring-2 focus:ring-[#D4AF37] 
                        focus:border-transparent transition-all duration-200"
              required
              aria-label="Location coordinates"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F5F5F5]/80 mb-2" htmlFor="type">
              Place Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1A2A44]/80 border-2 border-[#D4AF37]/30 
                        text-[#F5F5F5] focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent 
                        transition-all duration-200"
              required
              aria-label="Place type"
            >
              <option value="">Select a type</option>
              <option value="restaurant">Restaurant</option>
              <option value="hotel">Hotel</option>
              <option value="tourist_attraction">Tourist Attraction</option>
              <option value="cafe">Cafe</option>
              <option value="bar">Bar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F5F5F5]/80 mb-2" htmlFor="radius">
              Search Radius (meters)
            </label>
            <input
              id="radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              min="1000"
              max="50000"
              step="1000"
              className="w-full px-4 py-3 rounded-lg bg-[#1A2A44]/80 border-2 border-[#D4AF37]/30 
                        text-[#F5F5F5] focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent 
                        transition-all duration-200"
              aria-label="Search radius in meters"
            />
            <p className="mt-1 text-sm text-gray-400">
              Min: 1000m (1km), Max: 50000m (50km)
            </p>
          </div>
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0c1824] font-medium 
                      hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50
                      disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Fetch places"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0c1824]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fetching Places...
              </span>
            ) : (
              'Fetch Places'
            )}
          </motion.button>
        </form>
      </motion.div>
    </section>
  );
};

export default AdminPanel;