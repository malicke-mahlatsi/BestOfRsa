import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Grid, List, SortAsc, Search } from 'lucide-react';
import { Listing } from '../types';
import ListingCard from './ListingCard';
import ScoreBadge from './ScoreBadge';
import FilterSidebar from './FilterSidebar';
import InstantSearch from './InstantSearch';
import { useFilters } from '../hooks/useFilters';

interface ListingGridProps {
  listings: Listing[];
  title?: string;
  showAdvancedFilters?: boolean;
  onViewDetails?: (listing: Listing) => void;
}

const ListingGrid: React.FC<ListingGridProps> = ({ 
  listings, 
  title = "Featured Listings",
  showAdvancedFilters = true,
  onViewDetails
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'price' | 'location'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const {
    filters,
    filteredListings,
    updateFilter,
    clearAllFilters,
    getFilterCounts,
    resultsCount,
    totalCount
  } = useFilters(listings);

  const sortedListings = [...filteredListings].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price_range.length - b.price_range.length;
        case 'location':
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });

  const averageScore = sortedListings.length > 0 
    ? sortedListings.reduce((sum, listing) => sum + listing.score, 0) / sortedListings.length 
    : 0;

  const filterCounts = getFilterCounts();

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#0c1824] to-[#16283e]">
      {/* Filter Sidebar */}
      {showAdvancedFilters && (
        <FilterSidebar
          filters={filters}
          onFilterChange={updateFilter}
          onClearAll={clearAllFilters}
          filterCounts={filterCounts}
          resultsCount={resultsCount}
          totalCount={totalCount}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        <section className="ios-spacing-xl max-w-7xl mx-auto">
          {/* Header with Search */}
          {showAdvancedFilters && (
            <div className="ios-spacing-xl">
              <div className="bento-container grid-cols-1 lg:grid-cols-4 items-center">
                <div className="flex-1">
                  <InstantSearch
                    listings={listings}
                    onSearch={(query) => updateFilter('searchQuery', query)}
                    placeholder="Search venues, locations, categories..."
                  />
                </div>
                <motion.button
                  onClick={() => setShowFilters(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="lg:hidden bento-card flex items-center ios-gap-sm bg-[#D4AF37] text-[#0c1824] 
                           font-medium hover:bg-[#B8941F] transition-all duration-300"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </motion.button>
              </div>
            </div>
          )}

          {/* Title and Stats */}
          <div className="bento-container grid-cols-1 lg:grid-cols-2 items-center ios-spacing-lg">
            <div>
              <h2 className="text-3xl font-cinzel font-bold text-white mb-2">{title}</h2>
              <div className="flex items-center ios-gap-lg">
                <p className="text-white/80">
                  {resultsCount} of {totalCount} listings
                </p>
                {sortedListings.length > 0 && (
                  <div className="flex items-center ios-gap-sm">
                    <span className="text-white/60 text-sm">Average Score:</span>
                    <ScoreBadge score={averageScore} size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Sort and View Controls */}
            <div className="flex flex-wrap items-center ios-gap-lg">
              {showAdvancedFilters && (
                <motion.button
                  onClick={() => setShowFilters(true)}
                  whileHover={{ scale: 1.02 }}
                  className="hidden lg:flex items-center ios-gap-sm bento-card text-white text-sm 
                           hover:bg-white/20 transition-all duration-300"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </motion.button>
              )}

              <div className="flex items-center ios-gap-sm">
                <SortAsc className="w-4 h-4 text-white/60" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'price' | 'location')}
                  className="glass-card px-3 py-2 text-white text-sm
                           focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                >
                  <option value="score">Sort by Score</option>
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="location">Sort by Location</option>
                </select>
              </div>

              <div className="flex items-center ios-gap-xs glass-card p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-all duration-300 ${viewMode === 'grid' ? 'bg-[#D4AF37] text-[#0c1824]' : 'text-white/60 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-all duration-300 ${viewMode === 'list' ? 'bg-[#D4AF37] text-[#0c1824]' : 'text-white/60 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {sortedListings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center ios-spacing-2xl glass-card"
            >
              <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/60 text-lg mb-2">No listings match your current filters.</p>
              <p className="text-white/40 text-sm mb-6">Try adjusting your search criteria or clearing filters.</p>
              <motion.button
                onClick={clearAllFilters}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-[#D4AF37] text-[#0c1824] rounded-lg hover:bg-[#B8941F] transition-all duration-300"
              >
                Clear All Filters
              </motion.button>
            </motion.div>
          ) : (
            <div className={`bento-container ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {sortedListings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ListingGrid;