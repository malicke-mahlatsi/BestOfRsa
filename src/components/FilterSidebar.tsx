import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter,
  MapPin,
  DollarSign,
  Star,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves
} from 'lucide-react';
import { SearchFilters } from '../types';

interface FilterOption {
  value: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
}

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
  onClearAll: () => void;
  filterCounts: {
    locations: FilterOption[];
    priceRanges: FilterOption[];
    amenities: FilterOption[];
    categories: FilterOption[];
    subcategories: FilterOption[];
  };
  resultsCount: number;
  totalCount: number;
  isOpen: boolean;
  onClose: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  filterCounts,
  resultsCount,
  totalCount,
  isOpen,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    price: true,
    rating: true,
    amenities: false,
    category: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCheckboxChange = (filterKey: keyof SearchFilters, value: string) => {
    const currentValues = filters[filterKey] as string[] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange(filterKey, newValues);
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'wifi': <Wifi className="w-4 h-4" />,
      'parking': <Car className="w-4 h-4" />,
      'restaurant': <Utensils className="w-4 h-4" />,
      'gym': <Dumbbell className="w-4 h-4" />,
      'pool': <Waves className="w-4 h-4" />,
    };
    return iconMap[amenity.toLowerCase()] || <Star className="w-4 h-4" />;
  };

  const activeFiltersCount = 
    (filters.locations?.length || 0) +
    (filters.priceRange?.length || 0) +
    (filters.amenities?.length || 0) +
    (filters.categories?.length || 0) +
    (filters.subcategories?.length || 0) +
    (filters.minRating && filters.minRating > 0 ? 1 : 0);

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-[#D4AF37]">{icon}</div>
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 lg:relative lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            {activeFiltersCount > 0 && (
              <span className="bg-[#D4AF37] text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Results Count */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-[#D4AF37]">{resultsCount}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> results
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={onClearAll}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Location Filter */}
          <FilterSection
            title="Location"
            icon={<MapPin className="w-4 h-4" />}
            sectionKey="location"
          >
            <div className="space-y-2">
              {filterCounts.locations.map(location => (
                <label
                  key={location.value}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.locations?.includes(location.value) || false}
                      onChange={() => handleCheckboxChange('locations', location.value)}
                      className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-700">{location.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">({location.count})</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range Filter */}
          <FilterSection
            title="Price Range"
            icon={<DollarSign className="w-4 h-4" />}
            sectionKey="price"
          >
            <div className="space-y-2">
              {filterCounts.priceRanges.map(price => (
                <label
                  key={price.value}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.priceRange?.includes(price.value) || false}
                      onChange={() => handleCheckboxChange('priceRange', price.value)}
                      className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-700">{price.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">({price.count})</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Rating Filter */}
          <FilterSection
            title="Minimum Rating"
            icon={<Star className="w-4 h-4" />}
            sectionKey="rating"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minimum Score:</span>
                <span className="text-sm font-medium text-[#D4AF37]">
                  {filters.minRating || 0}/10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.minRating || 0}
                onChange={(e) => onFilterChange('minRating', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((filters.minRating || 0) / 10) * 100}%, #e5e7eb ${((filters.minRating || 0) / 10) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </FilterSection>

          {/* Amenities Filter */}
          <FilterSection
            title="Amenities"
            icon={<Wifi className="w-4 h-4" />}
            sectionKey="amenities"
          >
            <div className="space-y-2">
              {filterCounts.amenities.slice(0, 8).map(amenity => (
                <label
                  key={amenity.value}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.amenities?.includes(amenity.value) || false}
                      onChange={() => handleCheckboxChange('amenities', amenity.value)}
                      className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                    />
                    <div className="flex items-center gap-2">
                      {getAmenityIcon(amenity.value)}
                      <span className="text-sm text-gray-700">{amenity.label}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">({amenity.count})</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Category Filter */}
          <FilterSection
            title="Categories"
            icon={<Star className="w-4 h-4" />}
            sectionKey="category"
          >
            <div className="space-y-2">
              {filterCounts.categories.map(category => (
                <label
                  key={category.value}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category.value) || false}
                      onChange={() => handleCheckboxChange('categories', category.value)}
                      className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-700">{category.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">({category.count})</span>
                </label>
              ))}
            </div>
          </FilterSection>
        </div>
      </motion.div>
    </>
  );
};

export default FilterSidebar;