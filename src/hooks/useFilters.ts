import { useState, useMemo, useEffect } from 'react';
import { Listing, SearchFilters } from '../types';

export const useFilters = (listings: Listing[]) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    locations: [],
    priceRange: [],
    minRating: 0,
    amenities: [],
    categories: [],
    subcategories: []
  });

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.searchQuery) params.set('q', filters.searchQuery);
    if (filters.locations?.length) params.set('locations', filters.locations.join(','));
    if (filters.priceRange?.length) params.set('price', filters.priceRange.join(','));
    if (filters.minRating && filters.minRating > 0) params.set('rating', filters.minRating.toString());
    if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','));
    if (filters.categories?.length) params.set('categories', filters.categories.join(','));
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = listing.name.toLowerCase().includes(query);
        const matchesDescription = listing.description.toLowerCase().includes(query);
        const matchesLocation = listing.location.toLowerCase().includes(query);
        const matchesSubcategory = listing.subcategory.toLowerCase().includes(query);
        
        if (!matchesName && !matchesDescription && !matchesLocation && !matchesSubcategory) {
          return false;
        }
      }

      // Location filter
      if (filters.locations?.length && !filters.locations.includes(listing.location)) {
        return false;
      }

      // Price range filter
      if (filters.priceRange?.length && !filters.priceRange.includes(listing.price_range)) {
        return false;
      }

      // Rating filter
      if (filters.minRating && listing.score < filters.minRating) {
        return false;
      }

      // Amenities filter
      if (filters.amenities?.length) {
        const hasAllAmenities = filters.amenities.every(amenity =>
          listing.amenities.some(listingAmenity => 
            listingAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
        if (!hasAllAmenities) return false;
      }

      // Category filter
      if (filters.categories?.length && !filters.categories.includes(listing.category)) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategories?.length && !filters.subcategories.includes(listing.subcategory)) {
        return false;
      }

      return true;
    });
  }, [listings, filters]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      locations: [],
      priceRange: [],
      minRating: 0,
      amenities: [],
      categories: [],
      subcategories: []
    });
  };

  const getFilterCounts = () => {
    const locations = [...new Set(listings.map(l => l.location))];
    const priceRanges = [...new Set(listings.map(l => l.price_range))];
    const amenities = [...new Set(listings.flatMap(l => l.amenities))];
    const categories = [...new Set(listings.map(l => l.category))];
    const subcategories = [...new Set(listings.map(l => l.subcategory))];

    return {
      locations: locations.map(location => ({
        value: location,
        label: location,
        count: listings.filter(l => l.location === location).length
      })),
      priceRanges: priceRanges.map(price => ({
        value: price,
        label: price === '$' ? 'Budget ($)' : 
               price === '$$' ? 'Moderate ($$)' :
               price === '$$$' ? 'Upscale ($$$)' : 'Luxury ($$$$)',
        count: listings.filter(l => l.price_range === price).length
      })),
      amenities: amenities.slice(0, 10).map(amenity => ({
        value: amenity.toLowerCase(),
        label: amenity,
        count: listings.filter(l => l.amenities.includes(amenity)).length
      })),
      categories: categories.map(category => ({
        value: category,
        label: category.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        count: listings.filter(l => l.category === category).length
      })),
      subcategories: subcategories.map(subcategory => ({
        value: subcategory,
        label: subcategory,
        count: listings.filter(l => l.subcategory === subcategory).length
      }))
    };
  };

  return {
    filters,
    filteredListings,
    updateFilter,
    clearAllFilters,
    getFilterCounts,
    resultsCount: filteredListings.length,
    totalCount: listings.length
  };
};