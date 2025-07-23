import { Category } from '../types';

export const categories: Record<string, Category> = {
  'places-to-visit': {
    id: 'places-to-visit',
    name: 'Places to Visit',
    icon: '🏛️',
    description: 'Discover South Africa\'s top attractions and landmarks',
    subcategories: ['Museums', 'Nature Reserves', 'Historical Sites', 'Beaches', 'National Parks', 'Monuments'],
    color: 'from-blue-500 to-blue-700'
  },
  'things-to-do': {
    id: 'things-to-do',
    name: 'Things to Do',
    icon: '🎯',
    description: 'Activities and unforgettable experiences',
    subcategories: ['Safari', 'Adventure Sports', 'Wine Tours', 'Cultural Tours', 'Water Sports', 'Nightlife'],
    color: 'from-purple-500 to-purple-700'
  },
  'places-to-stay': {
    id: 'places-to-stay',
    name: 'Places to Stay',
    icon: '🏨',
    description: 'Hotels, lodges, and luxury accommodations',
    subcategories: ['Hotels', 'Safari Lodges', 'Guest Houses', 'Resorts', 'Boutique Hotels', 'B&Bs'],
    color: 'from-green-500 to-green-700'
  },
  'places-to-eat': {
    id: 'places-to-eat',
    name: 'Places to Eat',
    icon: '🍽️',
    description: 'Restaurants and exceptional dining experiences',
    subcategories: ['Fine Dining', 'Casual Dining', 'Traditional', 'International', 'Street Food', 'Cafes'],
    color: 'from-orange-500 to-orange-700'
  }
};