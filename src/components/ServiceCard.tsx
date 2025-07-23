import React from 'react';
import { motion } from 'framer-motion';
import { Service } from '../data/servicesData';
import StarRating from './StarRating';

interface ServiceCardProps {
  service: Service;
  index: number;
}

const ServiceCard = ({ service, index }: ServiceCardProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1
      }
    }
  };

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      className="rounded-lg overflow-hidden shadow-lg transition-all duration-300 
                hover:shadow-[0_10px_25px_-5px_rgba(212,175,55,0.3)] 
                bg-[#0c1824]/70 backdrop-blur-sm border border-[#D4AF37]/10
                hover:border-[#D4AF37]/30"
      role="article"
      aria-labelledby={`service-title-${service.id}`}
      tabIndex={0}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={service.image} 
          alt={`${service.title} - ${service.category}`}
          className="w-full h-full object-cover transition-transform duration-700
                    hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-[#0c1824]/80 backdrop-blur-sm
                       px-3 py-1 rounded-full border border-[#D4AF37]/20">
          <span className="text-xs font-medium text-[#D4AF37]">{service.category}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 
          id={`service-title-${service.id}`}
          className="text-xl font-cinzel font-semibold text-[#D4AF37] mb-2"
        >
          {service.title}
        </h3>
        <StarRating rating={service.rating} />
        <p className="text-gray-300 text-sm">{service.description}</p>
        
        <button 
          className="mt-4 w-full py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30
                    text-[#D4AF37] rounded-md transition-colors duration-300
                    hover:bg-[#D4AF37] hover:text-[#0c1824] font-medium text-sm
                    focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-opacity-50"
          aria-label={`View details for ${service.title}`}
          onClick={() => {/* Add view details handler */}}
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
};

export default ServiceCard;