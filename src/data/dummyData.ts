import { Listing, OperatingHours, PopularTimes, Review, Contact, Coordinates } from '../types';

const locations = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Stellenbosch', 'Port Elizabeth'];
const priceRanges = ['$', '$$', '$$$', '$$$$'];

// Operating hours templates
const operatingHoursTemplates: OperatingHours[] = [
  {
    Mon: "8:00 AM to 10:00 PM",
    Tue: "8:00 AM to 10:00 PM", 
    Wed: "8:00 AM to 10:00 PM",
    Thu: "8:00 AM to 11:00 PM",
    Fri: "8:00 AM to 11:00 PM",
    Sat: "9:00 AM to 11:00 PM",
    Sun: "9:00 AM to 9:00 PM"
  },
  {
    Mon: "9:00 AM to 6:00 PM",
    Tue: "9:00 AM to 6:00 PM",
    Wed: "9:00 AM to 6:00 PM", 
    Thu: "9:00 AM to 6:00 PM",
    Fri: "9:00 AM to 6:00 PM",
    Sat: "10:00 AM to 4:00 PM",
    Sun: "Closed"
  },
  {
    Mon: "6:00 AM to 11:00 PM",
    Tue: "6:00 AM to 11:00 PM",
    Wed: "6:00 AM to 11:00 PM",
    Thu: "6:00 AM to 12:00 AM",
    Fri: "6:00 AM to 12:00 AM", 
    Sat: "7:00 AM to 12:00 AM",
    Sun: "7:00 AM to 10:00 PM"
  }
];

// Generate popular times data
const generatePopularTimes = (): PopularTimes => {
  const generateDayData = () => {
    const data = new Array(24).fill(0);
    // Morning peak (8-10)
    for (let i = 8; i <= 10; i++) {
      data[i] = Math.floor(Math.random() * 30) + 20;
    }
    // Lunch peak (12-14)
    for (let i = 12; i <= 14; i++) {
      data[i] = Math.floor(Math.random() * 40) + 40;
    }
    // Evening peak (18-21)
    for (let i = 18; i <= 21; i++) {
      data[i] = Math.floor(Math.random() * 50) + 50;
    }
    // Fill other hours with lower values
    for (let i = 0; i < 24; i++) {
      if (data[i] === 0) {
        if (i >= 6 && i <= 23) {
          data[i] = Math.floor(Math.random() * 20) + 5;
        }
      }
    }
    return data;
  };

  return {
    Mon: generateDayData(),
    Tue: generateDayData(),
    Wed: generateDayData(),
    Thu: generateDayData(),
    Fri: generateDayData(),
    Sat: generateDayData(),
    Sun: generateDayData()
  };
};

// Generate reviews
const generateReviews = (count: number = 5): Review[] => {
  const reviewTexts = [
    "Amazing experience! The service was exceptional and the atmosphere was perfect. Highly recommend this place to anyone visiting the area. The attention to detail was remarkable.",
    "Great location with beautiful views. The staff was friendly and accommodating. Will definitely be back! The food was outstanding and the ambiance was perfect for our anniversary.",
    "Outstanding quality and attention to detail. Everything exceeded our expectations. A true gem in South Africa. The facilities are world-class and the experience was unforgettable.",
    "Wonderful experience from start to finish. The facilities are top-notch and the value is excellent. Perfect for families and couples alike.",
    "Fantastic place with authentic South African charm. The experience was memorable and worth every penny. The staff went above and beyond to make our stay special.",
    "Professional service and beautiful setting. Perfect for special occasions or just a great day out. The location is breathtaking and the service impeccable.",
    "Exceeded all expectations! The quality and service were world-class. Couldn't ask for more. This place sets the standard for excellence in South Africa."
  ];

  const authors = [
    "Sarah Johnson", "Michael Chen", "Emma Williams", "David Thompson", "Lisa Anderson",
    "James Wilson", "Maria Garcia", "Robert Taylor", "Jennifer Brown", "Christopher Lee",
    "Nomsa Mthembu", "Pieter van der Merwe", "Thandiwe Nkomo", "Johan Steyn", "Fatima Patel"
  ];

  const samplePhotos = [
    "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/2290070/pexels-photo-2290070.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=400"
  ];

  return Array(count).fill(null).map((_, i) => ({
    id: `review-${i}`,
    author: authors[Math.floor(Math.random() * authors.length)],
    rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
    date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
    helpful: Math.floor(Math.random() * 20) + 1,
    author_avatar: Math.random() > 0.3 ? `https://ui-avatars.com/api/?name=${encodeURIComponent(authors[Math.floor(Math.random() * authors.length)])}&background=D4AF37&color=fff` : undefined,
    verified: Math.random() > 0.6,
    photos: Math.random() > 0.7 ? samplePhotos.slice(0, Math.floor(Math.random() * 3) + 1) : undefined,
    helpful_votes: []
  }));
};

// Generate coordinates for South African cities
const generateCoordinates = (location: string): Coordinates => {
  const cityCoords: Record<string, Coordinates> = {
    'Cape Town': { lat: -33.9249, lng: 18.4241 },
    'Johannesburg': { lat: -26.2041, lng: 28.0473 },
    'Durban': { lat: -29.8587, lng: 31.0218 },
    'Pretoria': { lat: -25.7479, lng: 28.2293 },
    'Stellenbosch': { lat: -33.9321, lng: 18.8602 },
    'Port Elizabeth': { lat: -33.9608, lng: 25.6022 }
  };

  const baseCoord = cityCoords[location] || cityCoords['Cape Town'];
  return {
    lat: baseCoord.lat + (Math.random() * 0.1 - 0.05),
    lng: baseCoord.lng + (Math.random() * 0.1 - 0.05)
  };
};

// Generate category-specific data
const generateCategorySpecificData = (category: string, index: number) => {
  switch (category) {
    case 'places-to-eat':
      return {
        restaurant_data: {
          cuisines: [
            ['Italian', 'Mediterranean'],
            ['Asian', 'Fusion'],
            ['Traditional', 'South African'],
            ['Steakhouse', 'Grill'],
            ['Seafood', 'Contemporary'],
            ['French', 'Fine Dining']
          ][index % 6],
          dietary_options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'].slice(0, Math.floor(Math.random() * 3) + 1),
          popular_dishes: [
            { name: 'Grilled Kingklip', price: 185, description: 'Fresh local fish with seasonal vegetables' },
            { name: 'Beef Fillet', price: 245, description: 'Prime cut with red wine jus' },
            { name: 'Pasta Primavera', price: 125, description: 'Fresh pasta with seasonal vegetables' },
            { name: 'Bobotie', price: 145, description: 'Traditional South African dish' },
            { name: 'Springbok Carpaccio', price: 95, description: 'Thinly sliced game meat starter' }
          ].slice(0, 3),
          average_meal_price: ['R150-R250', 'R200-R350', 'R300-R500', 'R400-R650'][Math.floor(Math.random() * 4)],
          dress_code: ['Casual', 'Smart Casual', 'Formal'][Math.floor(Math.random() * 3)],
          reservations_required: Math.random() > 0.5
        }
      };

    case 'places-to-stay':
      return {
        hotel_data: {
          star_rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          room_types: [
            {
              type: 'Standard Room',
              size: '25m²',
              beds: 'King or Twin',
              price: 1200 + Math.floor(Math.random() * 800),
              image: `https://images.pexels.com/photos/${1400000 + index}/pexels-photo-${1400000 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`,
              amenities: ['Air Conditioning', 'WiFi', 'Mini Bar', 'Safe']
            },
            {
              type: 'Deluxe Suite',
              size: '45m²',
              beds: 'King',
              price: 2100 + Math.floor(Math.random() * 1200),
              image: `https://images.pexels.com/photos/${1500000 + index}/pexels-photo-${1500000 + index}.jpeg?auto=compress&cs=tinysrgb&w=400`,
              amenities: ['Air Conditioning', 'WiFi', 'Mini Bar', 'Safe', 'Balcony', 'Living Area']
            }
          ],
          hotel_amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Business Center', 'Concierge', 'Room Service', 'Parking'].slice(0, Math.floor(Math.random() * 4) + 6),
          check_in: '14:00',
          check_out: '11:00',
          cancellation_policy: 'Free cancellation up to 24 hours before check-in',
          pet_policy: Math.random() > 0.7 ? 'Pets allowed with additional fee' : 'No pets allowed'
        }
      };

    case 'things-to-do':
      return {
        activity_data: {
          duration: ['2-3 hours', '3-4 hours', '4-6 hours', 'Full day', 'Half day'][Math.floor(Math.random() * 5)],
          group_size: ['2-8 people', '2-12 people', '4-16 people', 'Up to 20 people'][Math.floor(Math.random() * 4)],
          difficulty: ['Easy', 'Moderate', 'Challenging'][Math.floor(Math.random() * 3)] as 'Easy' | 'Moderate' | 'Challenging',
          age_restriction: ['All ages', 'Ages 8+', 'Ages 12+', 'Ages 16+'][Math.floor(Math.random() * 4)],
          included: [
            'Professional guide',
            'Safety equipment',
            'Light refreshments',
            'Hotel pickup',
            'Transportation',
            'Entry fees',
            'Photography'
          ].slice(0, Math.floor(Math.random() * 4) + 3),
          highlights: [
            'Scenic views',
            'Wildlife spotting',
            'Cultural insights',
            'Adventure experience',
            'Local cuisine tasting',
            'Historical significance'
          ].slice(0, Math.floor(Math.random() * 3) + 2),
          requirements: ['Comfortable walking shoes', 'Sun protection', 'Camera', 'Water bottle'].slice(0, Math.floor(Math.random() * 3) + 1),
          cancellation_policy: 'Free cancellation up to 48 hours before activity',
          best_time: ['Morning', 'Afternoon', 'Evening', 'Sunset', 'Any time'][Math.floor(Math.random() * 5)]
        }
      };

    case 'places-to-visit':
      return {
        attraction_data: {
          ticket_prices: [
            { type: 'Adult', price: 150 + Math.floor(Math.random() * 200), description: 'General admission' },
            { type: 'Child (6-17)', price: 75 + Math.floor(Math.random() * 100), description: 'Reduced rate for children' },
            { type: 'Senior (65+)', price: 120 + Math.floor(Math.random() * 150), description: 'Senior citizen discount' },
            { type: 'Family (2+2)', price: 400 + Math.floor(Math.random() * 300), description: 'Family package deal' }
          ].slice(0, Math.floor(Math.random() * 2) + 2),
          best_time_to_visit: ['Early morning', 'Late afternoon', 'Weekdays', 'Off-season', 'Any time'][Math.floor(Math.random() * 5)],
          estimated_duration: ['1-2 hours', '2-3 hours', '3-4 hours', 'Half day', 'Full day'][Math.floor(Math.random() * 5)],
          accessibility: ['Wheelchair accessible', 'Audio guides available', 'Braille signage', 'Accessible parking'].slice(0, Math.floor(Math.random() * 3) + 1),
          facilities: ['Gift shop', 'Cafe', 'Restrooms', 'Parking', 'Audio guides', 'Information center'].slice(0, Math.floor(Math.random() * 4) + 2),
          guided_tours_available: Math.random() > 0.3,
          photography_allowed: Math.random() > 0.2
        }
      };

    default:
      return {};
  }
};

// Generate contact information
const generateContact = (name: string): Contact => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  return {
    phone: `+27 ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
    email: `info@${cleanName}.co.za`,
    website: `https://${cleanName}.co.za`,
    social: {
      facebook: `https://facebook.com/${cleanName}`,
      instagram: `https://instagram.com/${cleanName}`,
      twitter: `https://twitter.com/${cleanName}`
    }
  };
};

const venueNames = {
  'places-to-visit': [
    'Table Mountain National Park', 'Robben Island Museum', 'Kruger National Park', 'Cape Point Nature Reserve',
    'Apartheid Museum', 'Blyde River Canyon', 'Drakensberg Mountains', 'Hermanus Whale Watching',
    'Kirstenbosch Botanical Gardens', 'Gold Reef City', 'Two Oceans Aquarium', 'Castle of Good Hope'
  ],
  'things-to-do': [
    'Big Five Safari Experience', 'Cape Winelands Tour', 'Shark Cage Diving', 'Bungee Jumping Bloukrans',
    'Helicopter Tours Cape Town', 'Soweto Cultural Tour', 'Garden Route Adventure', 'Whale Watching Hermanus',
    'Hot Air Balloon Safari', 'Canopy Tours Tsitsikamma', 'Deep Sea Fishing', 'Township Jazz Tour'
  ],
  'places-to-stay': [
    'Mount Nelson Hotel', 'Sabi Sabi Safari Lodge', 'The Oyster Box Hotel', 'Ellerman House',
    'Singita Kruger National Park', 'Belmond Mount Nelson', 'Four Seasons Cape Town', 'Saxon Hotel',
    'Tintswalo Safari Lodge', 'La Residence', 'The Plettenberg Hotel', 'Grootbos Private Nature Reserve'
  ],
  'places-to-eat': [
    'La Colombe Restaurant', 'The Test Kitchen', 'Greenhouse at Cellars-Hohenort', 'FYN Restaurant',
    'Wolfgat Restaurant', 'The Pot Luck Club', 'Chefs Warehouse', 'Babel at Babylonstoren',
    'Jordan Restaurant', 'Overture Restaurant', 'The Restaurant at Waterkloof', 'Rust en Vrede'
  ]
};

const descriptions = {
  'places-to-visit': [
    'Experience breathtaking natural beauty and rich cultural heritage at this iconic South African destination.',
    'Discover the fascinating history and stunning landscapes that make this location truly unforgettable.',
    'Immerse yourself in the natural wonders and cultural significance of this remarkable attraction.',
    'Explore one of South Africa\'s most treasured landmarks with guided tours and interactive experiences.'
  ],
  'things-to-do': [
    'Embark on an unforgettable adventure that showcases the best of South African wildlife and culture.',
    'Experience world-class activities with professional guides and premium equipment in stunning locations.',
    'Create lasting memories with this unique South African experience combining adventure and luxury.',
    'Discover the thrill of authentic South African adventures in some of the world\'s most beautiful settings.'
  ],
  'places-to-stay': [
    'Luxury accommodation offering world-class service, premium amenities, and breathtaking views.',
    'Experience unparalleled hospitality in elegantly appointed rooms with authentic South African charm.',
    'Indulge in five-star comfort with exceptional dining, spa services, and personalized guest experiences.',
    'Sophisticated accommodation combining modern luxury with traditional South African hospitality.'
  ],
  'places-to-eat': [
    'Award-winning cuisine featuring innovative South African flavors and international culinary techniques.',
    'Exceptional dining experience with locally sourced ingredients and world-class wine pairings.',
    'Gourmet restaurant offering contemporary South African cuisine in an elegant atmosphere.',
    'Culinary excellence showcasing the finest local ingredients with creative presentation and flavors.'
  ]
};

const amenitiesOptions = {
  'places-to-visit': ['Guided Tours', 'Gift Shop', 'Parking', 'Wheelchair Access', 'Audio Guides', 'Cafe'],
  'things-to-do': ['Professional Guides', 'Equipment Included', 'Transport', 'Photography', 'Refreshments', 'Safety Gear'],
  'places-to-stay': ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Gym', 'Concierge', 'Room Service'],
  'places-to-eat': ['Wine Cellar', 'Private Dining', 'Outdoor Seating', 'Valet Parking', 'Live Music', 'Chef\'s Table']
};

export const generateDummyListing = (category: string, index: number): Listing => {
  const categoryNames = venueNames[category as keyof typeof venueNames] || [];
  const categoryDescriptions = descriptions[category as keyof typeof descriptions] || [];
  const categoryAmenities = amenitiesOptions[category as keyof typeof amenitiesOptions] || [];
  
  const score = Math.random() * 4 + 6; // 6.0-10.0
  const name = categoryNames[index % categoryNames.length] || `Premium ${category} Venue ${index + 1}`;
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  return {
    id: `${category}-${index}`,
    name,
    score: Number(score.toFixed(1)),
    category,
    subcategory: getSubcategoryForListing(category, index),
    price_range: priceRanges[Math.floor(Math.random() * priceRanges.length)],
    location,
    description: categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)],
    images: [
      `https://images.pexels.com/photos/${1000000 + index}/pexels-photo-${1000000 + index}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1`,
      `https://images.pexels.com/photos/${1100000 + index}/pexels-photo-${1100000 + index}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1`,
      `https://images.pexels.com/photos/${1200000 + index}/pexels-photo-${1200000 + index}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1`,
      `https://images.pexels.com/photos/${1300000 + index}/pexels-photo-${1300000 + index}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1`
    ],
    amenities: categoryAmenities.slice(0, Math.floor(Math.random() * 4) + 2),
    featured: Math.random() > 0.8,
    address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Ocean', 'Mountain', 'Garden', 'Heritage'][Math.floor(Math.random() * 5)]} Street`,
    operating_hours: operatingHoursTemplates[Math.floor(Math.random() * operatingHoursTemplates.length)],
    popular_times: generatePopularTimes(),
    coordinates: generateCoordinates(location),
    reviews: generateReviews(Math.floor(Math.random() * 8) + 3),
    contact: generateContact(name),
    detailed_description: `${categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)]} Located in the heart of ${location}, this exceptional venue offers an unforgettable experience that combines luxury, comfort, and authentic South African hospitality. Whether you're a local resident or visiting tourist, you'll find everything you need for a memorable experience.`,
    highlights: [
      'Award-winning service',
      'Prime location',
      'Authentic South African experience',
      'Professional staff',
      'Modern facilities'
    ].slice(0, Math.floor(Math.random() * 3) + 2),
    policies: [
      'Advance booking recommended',
      'Smart casual dress code',
      'Children welcome',
      'No smoking indoors'
    ],
    ...generateCategorySpecificData(category, index)
  };
};

const getSubcategoryForListing = (category: string, index: number): string => {
  const subcategories = {
    'places-to-visit': ['Museums', 'Nature Reserves', 'Historical Sites', 'Beaches', 'National Parks', 'Monuments'],
    'things-to-do': ['Safari', 'Adventure Sports', 'Wine Tours', 'Cultural Tours', 'Water Sports', 'Nightlife'],
    'places-to-stay': ['Hotels', 'Safari Lodges', 'Guest Houses', 'Resorts', 'Boutique Hotels', 'B&Bs'],
    'places-to-eat': ['Fine Dining', 'Casual Dining', 'Traditional', 'International', 'Street Food', 'Cafes']
  };
  
  const categorySubcategories = subcategories[category as keyof typeof subcategories] || ['General'];
  return categorySubcategories[index % categorySubcategories.length];
};

// Generate dummy data for all categories
export const dummyListings: Listing[] = [];

Object.keys(venueNames).forEach(category => {
  for (let i = 0; i < 12; i++) {
    dummyListings.push(generateDummyListing(category, i));
  }
});