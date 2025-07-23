import React from 'react';
import { Search } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Header = ({ searchTerm, setSearchTerm }: HeaderProps) => {
  return (
    <header className="sticky top-0 w-full z-10 bg-[#0c1824]/80 backdrop-blur-lg border-b border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-4xl font-cinzel font-bold text-[#D4AF37] text-center md:text-left animate-glow">
            BestOfRSA
          </h1>
          
          <div className="relative w-full md:w-1/2 lg:w-1/3">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              aria-label="Search services"
              className="w-full px-4 py-3 pl-10 rounded-lg bg-[#1A2A44]/80 border border-[#D4AF37]/30 
                        text-white placeholder-gray-400 focus:ring-2 focus:ring-[#D4AF37] 
                        focus:border-transparent transition-all duration-200"
            />
            <Search className="absolute top-3 left-3 text-[#D4AF37]/70 h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;