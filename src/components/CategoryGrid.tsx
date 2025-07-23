import React from 'react';
import { motion } from 'framer-motion';
import { categories } from '../data/categories';
import { Listing } from '../types';
import CategoryCard from './CategoryCard';

interface CategoryGridProps {
  listings: Listing[];
  onCategorySelect: (categoryId: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ listings, onCategorySelect }) => {
  const getCategoryCount = (categoryId: string) => {
    return listings.filter(listing => listing.category === categoryId).length;
  };

  return (
    <section className="ios-spacing-2xl max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center ios-spacing-xl"
      >
        <h2 className="text-4xl font-cinzel font-bold text-white mb-4">
          Explore by Category
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Discover the best South Africa has to offer across our curated categories
        </p>
      </motion.div>

      <div className="bento-container grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Object.values(categories).map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bento-card hover:scale-[1.02] transition-all duration-300"
          >
            <CategoryCard
              category={category}
              listingCount={getCategoryCount(category.id)}
              onClick={() => onCategorySelect(category.id)}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;