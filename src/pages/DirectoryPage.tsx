import React, { useState, useEffect } from 'react';
import { getAllServices, getCategories } from '../api/services';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import ServiceGrid from '../components/ServiceGrid';
import Footer from '../components/Footer';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  image_url: string;
  rating: number;
  category: Category;
  phone: string;
  website: string;
  address: string;
  email: string;
}

const DirectoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [servicesData, categoriesData] = await Promise.all([
          getAllServices(),
          getCategories()
        ]);
        
        setServices(servicesData);
        setCategories(categoriesData);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter services based on search term and selected category
  const filteredServices = services.filter(service => 
    (selectedCategory === 'All' || service.category.name === selectedCategory) &&
    (service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e] text-white">
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-[#D4AF37] text-xl" role="alert">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30
                     text-[#D4AF37] rounded-md hover:bg-[#D4AF37] hover:text-[#0c1824]
                     transition-colors duration-300"
          >
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e] text-white font-montserrat">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-cinzel font-bold text-center mb-3 text-[#D4AF37]">
            Discover South Africa's Finest
          </h2>
          <p className="text-center text-gray-300 max-w-2xl mx-auto">
            Explore the best restaurants, hotels, and attractions that South Africa has to offer,
            all curated and rated for your convenience.
          </p>
        </section>
        
        {isLoading ? (
          <div className="text-center py-12" role="status">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading services...</p>
          </div>
        ) : (
          <>
            <CategoryFilter 
              categories={categories.map(cat => cat.name)}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
            
            <ServiceGrid services={filteredServices.map(service => ({
              id: service.id,
              title: service.title,
              description: service.description,
              image: service.image_url,
              rating: service.rating,
              category: service.category.name,
              contact: {
                phone: service.phone,
                website: service.website,
                address: service.address,
                email: service.email
              }
            }))} />
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default DirectoryPage;