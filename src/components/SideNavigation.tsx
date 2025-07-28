import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  MapPin, 
  Star, 
  Settings, 
  User, 
  Heart,
  Calendar,
  Phone,
  Mail,
  Globe,
  ChevronRight,
  X,
  Menu
} from 'lucide-react';

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  currentSection?: string;
}

const SideNavigation: React.FC<SideNavigationProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  currentSection = 'home' 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const navigationSections = [
    {
      id: 'main',
      title: 'MAIN',
      items: [
        { id: 'home', label: 'HOME', icon: Home, action: () => onNavigate('home') },
        { id: 'search', label: 'SEARCH', icon: Search, action: () => onNavigate('search') },
        { id: 'favorites', label: 'FAVORITES', icon: Heart, action: () => onNavigate('favorites') },
        { id: 'bookings', label: 'BOOKINGS', icon: Calendar, action: () => onNavigate('bookings') }
      ]
    },
    {
      id: 'categories',
      title: 'CATEGORIES',
      items: [
        { id: 'places-to-eat', label: 'RESTAURANTS', icon: '🍽️', action: () => onNavigate('places-to-eat') },
        { id: 'places-to-stay', label: 'HOTELS', icon: '🏨', action: () => onNavigate('places-to-stay') },
        { id: 'places-to-visit', label: 'ATTRACTIONS', icon: '🏛️', action: () => onNavigate('places-to-visit') },
        { id: 'things-to-do', label: 'ACTIVITIES', icon: '🎯', action: () => onNavigate('things-to-do') }
      ]
    },
    {
      id: 'locations',
      title: 'LOCATIONS',
      items: [
        { id: 'cape-town', label: 'CAPE TOWN', icon: MapPin, action: () => onNavigate('cape-town') },
        { id: 'johannesburg', label: 'JOHANNESBURG', icon: MapPin, action: () => onNavigate('johannesburg') },
        { id: 'durban', label: 'DURBAN', icon: MapPin, action: () => onNavigate('durban') },
        { id: 'pretoria', label: 'PRETORIA', icon: MapPin, action: () => onNavigate('pretoria') }
      ]
    },
    {
      id: 'admin',
      title: 'ADMIN TOOLS',
      items: [
        { id: 'data-parser', label: 'DATA PARSER', icon: '📊', action: () => onNavigate('data-parser') },
        { id: 'bulk-import', label: 'BULK IMPORT', icon: '📥', action: () => onNavigate('bulk-import') },
        { id: 'reviews', label: 'REVIEWS', icon: '⭐', action: () => onNavigate('reviews') },
        { id: 'images', label: 'IMAGES', icon: '🖼️', action: () => onNavigate('images') },
        { id: 'enhancement', label: 'ENHANCEMENT', icon: '✨', action: () => onNavigate('enhancement') },
        { id: 'database', label: 'DATABASE', icon: '🗄️', action: () => onNavigate('database') },
        { id: 'osm-data', label: 'OSM DATA', icon: '🗺️', action: () => onNavigate('osm-data') }
      ]
    },
    {
      id: 'account',
      title: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'PROFILE', icon: User, action: () => onNavigate('profile') },
        { id: 'settings', label: 'SETTINGS', icon: Settings, action: () => onNavigate('settings') }
      ]
    },
    {
      id: 'contact',
      title: 'CONTACT',
      items: [
        { id: 'phone', label: '+27 21 123 4567', icon: Phone, action: () => window.open('tel:+27211234567') },
        { id: 'email', label: 'INFO@BESTRSA.COM', icon: Mail, action: () => window.open('mailto:info@bestrsa.com') },
        { id: 'website', label: 'BESTRSA.COM', icon: Globe, action: () => window.open('https://bestrsa.com') }
      ]
    }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  const itemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      opacity: 0,
      x: -20
    }
  };

  const NavigationItem: React.FC<{
    item: any;
    isActive: boolean;
    delay: number;
  }> = ({ item, isActive, delay }) => (
    <motion.button
      variants={itemVariants}
      initial="closed"
      animate="open"
      transition={{ delay }}
      onClick={item.action}
      className={`w-full flex items-center justify-between px-6 py-3 text-left transition-all duration-300 group ${
        isActive 
          ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-r-2 border-[#D4AF37]' 
          : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {typeof item.icon === 'string' ? (
            <span className="text-lg">{item.icon}</span>
          ) : (
            <item.icon className="w-5 h-5" />
          )}
        </div>
        <span className="font-medium text-sm tracking-wide">{item.label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
        isActive ? 'text-[#D4AF37]' : 'text-white/30 group-hover:text-white/60'
      }`} />
    </motion.button>
  );

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-[#0c1824] to-[#16283e] 
                   shadow-2xl z-50 overflow-y-auto scrollbar-thin scrollbar-track-transparent 
                   scrollbar-thumb-[#D4AF37]/30"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0c1824] to-[#1a2f47] 
                       border-b border-[#D4AF37]/20 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between px-6 py-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] 
                             rounded-lg flex items-center justify-center">
                <span className="text-[#0c1824] font-bold text-sm">B</span>
              </div>
              <div>
                <h2 className="text-xl font-cinzel font-bold text-white">
                  Best<span className="text-[#D4AF37]">Of</span>RSA
                </h2>
                <p className="text-xs text-white/60 font-medium tracking-wide">
                  DISCOVER SOUTH AFRICA
                </p>
              </div>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300"
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="py-6">
          {navigationSections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + sectionIndex * 0.05 }}
              className="mb-8"
            >
              {/* Section Title */}
              <div className="px-6 mb-3">
                <h3 className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
                  {section.title}
                </h3>
                <div className="mt-2 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
              </div>

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <NavigationItem
                    key={item.id}
                    item={item}
                    isActive={currentSection === item.id}
                    delay={0.2 + sectionIndex * 0.05 + itemIndex * 0.02}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-0 bg-gradient-to-t from-[#0c1824] to-transparent 
                     border-t border-[#D4AF37]/20 p-6"
        >
          <div className="text-center">
            <div className="text-xs text-white/40 font-medium tracking-wide mb-2">
              © 2024 BESTOFRSA
            </div>
            <div className="flex justify-center space-x-4">
              <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-[#D4AF37]/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-2 h-2 bg-[#D4AF37]/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SideNavigation;