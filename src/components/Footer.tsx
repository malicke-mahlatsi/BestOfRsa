import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-16 bg-[#0c1824]/90 backdrop-blur-sm border-t border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-cinzel font-bold text-[#D4AF37]">BestOfRSA</h2>
            <p className="text-gray-400 mt-1">Discover South Africa's finest services</p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">About Us</a>
            <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Contact</a>
            <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Terms</a>
          </div>
        </div>
        
        <div className="mt-8 border-t border-[#D4AF37]/10 pt-6 text-center">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} BestOfRSA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;