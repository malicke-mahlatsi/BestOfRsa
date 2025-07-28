import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import HeroSection from './components/HeroSection';
import CategoryGrid from './components/CategoryGrid';
import ListingGrid from './components/ListingGrid';
import VenueDetailPage from './components/VenueDetailPage';
import SideNavigation from './components/SideNavigation';
import WebScrapingInterface from './components/WebScrapingInterface';
import { dummyListings } from './data/dummyData';
import { categories } from './data/categories';
import { SearchFilters, Listing } from './types';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [selectedVenue, setSelectedVenue] = useState<Listing | null>(null);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');
  const [showWebScraping, setShowWebScraping] = useState(false);
  const [showDataParser, setShowDataParser] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showReviewCollection, setShowReviewCollection] = useState(false);
  const [showImageManagement, setShowImageManagement] = useState(false);
  const [showContentEnhancement, setShowContentEnhancement] = useState(false);
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [showOSMCollector, setShowOSMCollector] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchFilters({ category: categoryId });
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setSelectedCategory(null);
  };

  const handleBackToHome = () => {
    setSelectedCategory(null);
    setSearchFilters({});
    setSelectedVenue(null);
  };

  const handleViewDetails = (listing: Listing) => {
    setSelectedVenue(listing);
  };

  const handleBackFromVenue = () => {
    setSelectedVenue(null);
  };

  const handleSideNavigation = (section: string) => {
    setCurrentSection(section);
    setSideNavOpen(false);
    
    // Handle navigation logic
    switch (section) {
      case 'home':
        handleBackToHome();
        break;
      case 'places-to-eat':
      case 'places-to-stay':
      case 'places-to-visit':
      case 'things-to-do':
        handleCategorySelect(section);
        break;
      case 'web-scraping':
        setShowWebScraping(true);
        break;
      case 'data-parser':
        setShowDataParser(true);
        break;
      case 'bulk-import':
        setShowBulkImport(true);
        break;
      case 'reviews':
        setShowReviewCollection(true);
        break;
      case 'images':
        setShowImageManagement(true);
        break;
      case 'enhancement':
        setShowContentEnhancement(true);
        break;
      case 'database':
        setShowDatabasePanel(true);
        break;
      case 'osm-data':
        setShowOSMCollector(true);
        break;
      default:
        // Handle other sections like locations, profile, etc.
        break;
    }
  };

  const getFilteredListings = (): Listing[] => {
    let filtered = dummyListings;

    if (selectedCategory) {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }

    if (searchFilters.location) {
      filtered = filtered.filter(listing => 
        listing.location.toLowerCase().includes(searchFilters.location!.toLowerCase())
      );
    }

    if (searchFilters.minScore) {
      filtered = filtered.filter(listing => listing.score >= searchFilters.minScore!);
    }

    return filtered;
  };

  const filteredListings = getFilteredListings();
  const featuredListings = dummyListings.filter(listing => listing.featured).slice(0, 8);

  // Show venue detail page if a venue is selected
  if (selectedVenue) {
    return <VenueDetailPage venue={selectedVenue} onBack={handleBackFromVenue} />;
  }

  // Show web scraping interface
  if (showWebScraping) {
    return <WebScrapingInterface />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e]">
      {/* Side Navigation */}
      <SideNavigation
        isOpen={sideNavOpen}
        onClose={() => setSideNavOpen(false)}
        onNavigate={handleSideNavigation}
        currentSection={currentSection}
      />

      {/* Navigation */}
      <nav className="relative z-40 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Side - Menu Button and Logo */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => setSideNavOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl glass-card text-white hover:text-[#D4AF37] 
                          transition-all duration-300 hover:bg-white/10"
              >
                <Menu className="w-6 h-6" />
              </motion.button>
              
              <motion.button
                onClick={handleBackToHome}
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-cinzel font-bold text-white hover:text-[#D4AF37] 
                          transition-all duration-300"
              >
                Best<span className="text-[#D4AF37]">Of</span>RSA
              </motion.button>
            </div>
            
            {/* Center - Quick Categories (Desktop) */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="flex items-center space-x-1 glass-card p-2 rounded-xl">
                {Object.values(categories).map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-[#D4AF37] text-[#0c1824]'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{category.icon}</span>
                      <span className="hidden xl:inline">{category.name.split(' ').pop()}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Right Side - Search or User Actions */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center space-x-2 glass-card px-4 py-2 rounded-xl 
                          text-white/70 hover:text-white transition-all duration-300"
              >
                <span className="text-sm font-medium">Search</span>
              </motion.button>
              
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] 
                             rounded-full flex items-center justify-center">
                <span className="text-[#0c1824] font-bold text-sm">U</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {!selectedCategory && Object.keys(searchFilters).length === 0 ? (
        <>
          <HeroSection listings={dummyListings} onSearch={handleSearch} />
          <CategoryGrid 
            listings={dummyListings} 
            onCategorySelect={handleCategorySelect} 
          />
          <ListingGrid 
            listings={featuredListings}
            title="Featured Destinations"
            showAdvancedFilters={false}
            onViewDetails={handleViewDetails}
          />
        </>
      ) : (
        <>
          <div className="bg-[#0c1824] py-4">
            <div className="max-w-7xl mx-auto px-4">
              <motion.button
                onClick={handleBackToHome}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 text-[#D4AF37] hover:text-white transition-colors"
              >
                ← Back to Home
              </motion.button>
            </div>
          </div>
          <ListingGrid 
            listings={filteredListings}
            title={selectedCategory ? categories[selectedCategory]?.name : "Search Results"}
            showAdvancedFilters={true}
            onViewDetails={handleViewDetails}
          />
        </>
      )}

      {/* Footer */}
      <footer className="bg-[#0c1824]/90 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-cinzel font-bold text-white mb-4">
                Best<span className="text-[#D4AF37]">Of</span>RSA
              </h3>
              <p className="text-white/60 mb-4">
                Discover South Africa's finest destinations, experiences, and hidden gems. 
                Your trusted guide to the best the country has to offer.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                {Object.values(categories).map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      className="text-white/60 hover:text-[#D4AF37] transition-colors text-sm"
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-white/60 hover:text-[#D4AF37] transition-colors">About Us</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#D4AF37] transition-colors">Contact</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#D4AF37] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#D4AF37] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} BestOfRSA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;