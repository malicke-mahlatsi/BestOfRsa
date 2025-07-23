import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bestrsa_favorites');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bestrsa_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const toggleFavorite = (venueId: string) => {
    setFavorites(prev => {
      if (prev.includes(venueId)) {
        return prev.filter(id => id !== venueId);
      } else {
        return [...prev, venueId];
      }
    });
  };

  const isFavorite = (venueId: string) => favorites.includes(venueId);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    favoriteCount: favorites.length
  };
};