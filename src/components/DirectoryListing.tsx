import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { cityCoordinates } from '../api/services';
import { Search, MapPin, Globe, Phone, Mail } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  rating: number;
  phone: string | null;
  website: string | null;
  address: string | null;
  email: string | null;
  city: string | null;
  category_name: string;
}

const DirectoryListing: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState<keyof typeof cityCoordinates>('Cape Town');

  const categories = ['All', 'Restaurants', 'Hotels', 'Attractions', 'Safari Tours', 'Wine Estates'];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        const { data: servicesData, error: fetchError } = await supabase
          .from('services')
          .select('*, categories(name)');

        if (fetchError) throw fetchError;

        // Transform services data to match Service interface
        const transformedData = servicesData?.map(service => ({
          id: service.id,
          title: service.title,
          description: service.description,
          image_url: service.image_url,
          rating: service.rating || 0,
          phone: service.phone,
          website: service.website,
          address: service.address,
          email: service.email,
          city: service.city,
          category_name: service.categories?.name || 'Uncategorized'
        })) || [];

        setServices(transformedData);
      } catch (err) {
        console.error('Error fetching services:', err);
        if (err instanceof Error && err.message.includes('Missing Supabase environment variables')) {
          setError('Configuration Error: Please set up your Supabase environment variables in the .env file and restart the development server.');
        } else if (err instanceof Error) {
          setError(`Failed to load services: ${err.message}. Please check your Supabase configuration.`);
        } else {
          setError('Failed to load services. Please check your Supabase connection and environment variables.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter(service =>
    (selectedCategory === 'All' || service.category_name === selectedCategory) &&
    (searchTerm === '' || 
     service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     service.address?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e] text-white">
      <header className="sticky top-0 z-10 bg-[#0c1824]/80 backdrop-blur-sm border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h1 className="text-4xl font-cinzel font-bold text-[#D4AF37] animate-glow">
              BestOfRSA
            </h1>
            
            <div className="w-full md:w-1/2 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/70 h-5 w-5" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search services..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1A2A44]/80 border border-[#D4AF37]/30 
                          text-white placeholder-gray-400 focus:ring-2 focus:ring-[#D4AF37] 
                          focus:border-transparent transition-all duration-200"
                  aria-label="Search services"
                />
              </div>
              
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value as keyof typeof cityCoordinates)}
                className="px-4 py-2 rounded-lg bg-[#1A2A44]/80 border border-[#D4AF37]/30 
                        text-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent 
                        transition-all duration-200"
                aria-label="Select city"
              >
                {Object.keys(cityCoordinates).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {categories.map(category => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-[#D4AF37] text-[#0c1824]'
                  : 'bg-[#1A2A44]/50 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#1A2A44]/80'
              }`}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-[#D4AF37]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 
                      text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#1A2A44]/30 rounded-lg overflow-hidden border border-[#D4AF37]/10 
                        hover:border-[#D4AF37]/30 transition-all duration-300 shadow-lg 
                        hover:shadow-[#D4AF37]/20"
              >
                {service.image_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-[#0c1824]/80 backdrop-blur-sm px-3 py-1 
                                rounded-full border border-[#D4AF37]/20">
                      <span className="text-xs font-medium text-[#D4AF37]">{service.category_name}</span>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-cinzel font-semibold text-[#D4AF37] mb-2">
                    {service.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(service.rating) ? 'text-[#D4AF37]' : 'text-[#D4AF37]/20'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </motion.svg>
                    ))}
                    <span className="text-sm text-gray-400 ml-1">{service.rating.toFixed(1)}</span>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {service.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 text-[#D4AF37] mt-1 flex-shrink-0" />
                      <span>{service.address}</span>
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    {service.website && (
                      <a
                        href={service.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Visit Website</span>
                      </a>
                    )}
                    
                    {service.phone && (
                      <a
                        href={`tel:${service.phone}`}
                        className="flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{service.phone}</span>
                      </a>
                    )}
                    
                    {service.email && (
                      <a
                        href={`mailto:${service.email}`}
                        className="flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{service.email}</span>
                      </a>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 
                            text-[#D4AF37] rounded-md transition-all duration-300
                            hover:bg-[#D4AF37] hover:text-[#0c1824]"
                  >
                    View Details
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DirectoryListing;