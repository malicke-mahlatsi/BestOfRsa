import React from 'react';
import { motion } from 'framer-motion';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
  listingCount: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick, listingCount }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group h-full"
    >
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${category.color} 
                     ios-spacing-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between ios-spacing-sm">
            <div className="text-4xl">{category.icon}</div>
            <div className="glass-card px-3 py-1 text-xs">
              <span className="text-sm font-medium">{listingCount} places</span>
            </div>
          </div>
          
          <h3 className="text-xl font-cinzel font-bold ios-spacing-sm group-hover:text-yellow-200 transition-colors">
            {category.name}
          </h3>
          
          <p className="text-white/90 text-sm ios-spacing-sm line-clamp-2 flex-grow">
            {category.description}
          </p>
          
          <div className="flex flex-wrap ios-gap-xs mt-auto">
            {category.subcategories.slice(0, 3).map((sub, index) => (
              <span
                key={index}
                className="glass-card px-2 py-1 text-xs"
              >
                {sub}
              </span>
            ))}
            {category.subcategories.length > 3 && (
              <span className="glass-card px-2 py-1 text-xs">
                +{category.subcategories.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mb-10 
                       group-hover:scale-150 transition-transform duration-500" />
      </div>
    </motion.div>
  );
};

export default CategoryCard;