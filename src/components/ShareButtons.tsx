import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Facebook, Twitter, MessageCircle, Link, Check } from 'lucide-react';
import { Listing } from '../types';

interface ShareButtonsProps {
  venue: Listing;
  className?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ venue, className = '' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${venue.name} on BestOfRSA - ${venue.description.substring(0, 100)}...`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      color: 'text-green-600 hover:bg-green-50'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'text-blue-400 hover:bg-blue-50'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 
                 rounded-lg transition-colors text-gray-700"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </motion.button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border 
                     border-gray-200 py-2 min-w-48 z-20"
          >
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleShare(option.url)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${option.color}`}
              >
                <option.icon className="w-5 h-5" />
                <span className="font-medium">{option.name}</span>
              </button>
            ))}
            
            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Link className="w-5 h-5" />
                  <span className="font-medium">Copy Link</span>
                </>
              )}
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ShareButtons;