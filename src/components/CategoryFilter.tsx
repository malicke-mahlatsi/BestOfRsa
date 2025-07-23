import React from 'react';
import { motion } from 'framer-motion';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  setSelectedCategory 
}: CategoryFilterProps) => {
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <div 
      className="flex flex-wrap gap-3 mb-8 justify-center"
      role="radiogroup"
      aria-label="Filter services by category"
    >
      {['All', ...categories].map(category => (
        <motion.button
          key={category}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => setSelectedCategory(category)}
          aria-pressed={selectedCategory === category}
          className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 
            focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-opacity-50 ${
            selectedCategory === category
              ? 'bg-[#D4AF37] text-[#0c1824] shadow-lg shadow-[#D4AF37]/20'
              : 'bg-[#1A2A44]/50 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#1A2A44]/80 hover:border-[#D4AF37]/50'
          }`}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;