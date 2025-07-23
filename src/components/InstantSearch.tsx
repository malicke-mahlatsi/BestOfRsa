import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Tag, Star } from 'lucide-react';
import { Listing } from '../types';

interface SearchSuggestion {
  type: 'venue' | 'location' | 'category' | 'subcategory';
  value: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface InstantSearchProps {
  listings: Listing[];
  onSearch: (query: string) => void;
  placeholder?: string;
}

const InstantSearch: React.FC<InstantSearchProps> = ({ 
  listings, 
  onSearch, 
  placeholder = "Search venues, locations, or categories..." 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Generate search index
  const searchIndex = React.useMemo(() => {
    const venues = listings.map(listing => ({
      type: 'venue' as const,
      value: listing.name,
      label: listing.name,
      icon: <Star className="w-4 h-4" />,
      location: listing.location,
      score: listing.score
    }));

    const locations = [...new Set(listings.map(l => l.location))].map(location => ({
      type: 'location' as const,
      value: location,
      label: location,
      icon: <MapPin className="w-4 h-4" />,
      count: listings.filter(l => l.location === location).length
    }));

    const categories = [...new Set(listings.map(l => l.category))].map(category => ({
      type: 'category' as const,
      value: category,
      label: category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      icon: <Tag className="w-4 h-4" />,
      count: listings.filter(l => l.category === category).length
    }));

    const subcategories = [...new Set(listings.map(l => l.subcategory))].map(subcategory => ({
      type: 'subcategory' as const,
      value: subcategory,
      label: subcategory,
      icon: <Tag className="w-4 h-4" />,
      count: listings.filter(l => l.subcategory === subcategory).length
    }));

    return [...venues, ...locations, ...categories, ...subcategories];
  }, [listings]);

  // Handle search input
  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearch(value);

    if (value.trim().length > 0) {
      const filtered = searchIndex
        .filter(item => 
          item.label.toLowerCase().includes(value.toLowerCase()) ||
          item.value.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 8); // Limit to 8 suggestions

      setSuggestions(filtered);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.label);
    onSearch(suggestion.label);
    setIsOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'venue': return 'text-blue-600';
      case 'location': return 'text-green-600';
      case 'category': return 'text-purple-600';
      case 'subcategory': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'venue': return 'Venue';
      case 'location': return 'Location';
      case 'category': return 'Category';
      case 'subcategory': return 'Type';
      default: return '';
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/90 border border-gray-200 
                   focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all
                   text-gray-800 placeholder-gray-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              onSearch('');
              setIsOpen(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 
                     overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={`${suggestion.type}-${suggestion.value}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`p-4 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0
                          ${selectedIndex === index ? 'bg-[#D4AF37]/10' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={getSuggestionTypeColor(suggestion.type)}>
                      {suggestion.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{suggestion.label}</div>
                      <div className="text-sm text-gray-500">
                        {getSuggestionTypeLabel(suggestion.type)}
                        {suggestion.type === 'venue' && suggestion.location && (
                          <span> • {suggestion.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {suggestion.count && (
                    <div className="text-sm text-gray-400">
                      {suggestion.count} results
                    </div>
                  )}
                  {suggestion.type === 'venue' && suggestion.score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-600">
                        {suggestion.score}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstantSearch;