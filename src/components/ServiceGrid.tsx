import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Service } from '../data/servicesData';
import ServiceCard from './ServiceCard';

interface ServiceGridProps {
  services: Service[];
}

const ServiceGrid = ({ services }: ServiceGridProps) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
      role="region"
      aria-label="Services grid"
    >
      {services.length > 0 ? (
        services.map((service, index) => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            index={index}
          />
        ))
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full text-center py-12"
          role="alert"
          aria-live="polite"
        >
          <p className="text-lg text-gray-400">No services found matching your search criteria.</p>
          <button 
            className="mt-4 px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30
                      text-[#D4AF37] rounded-md transition-colors duration-300
                      hover:bg-[#D4AF37] hover:text-[#0c1824]
                      focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-opacity-50"
            onClick={() => window.location.reload()}
            aria-label="Clear all filters and reload page"
          >
            Clear Filters
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ServiceGrid;