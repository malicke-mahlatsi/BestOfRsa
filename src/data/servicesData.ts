export interface Service {
  id: number;
  title: string;
  description: string;
  image: string;
  rating: number;
  category: string;
  contact: {
    phone: string;
    website: string;
    address: string;
    email: string;
  };
}

export interface CategoryData {
  id: number;
  category: string;
  description: string;
  services: Omit<Service, 'category'>[];
}

export const servicesData: CategoryData[] = [
  {
    id: 1,
    category: "Restaurants",
    description: "Experience South Africa's finest dining establishments",
    services: [
      { 
        id: 1, 
        title: "Cape Spice", 
        description: "Authentic South African cuisine with traditional spices and flavors in an elegant setting.", 
        image: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.5,
        contact: {
          phone: "+27 21 123 4567",
          website: "https://capespice.example.com",
          address: "123 Long Street, Cape Town",
          email: "info@capespice.example.com"
        }
      },
      { 
        id: 2, 
        title: "Ocean Grill", 
        description: "Fresh seafood with panoramic ocean views and a relaxed atmosphere.", 
        image: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.8,
        contact: {
          phone: "+27 21 234 5678",
          website: "https://oceangrill.example.com",
          address: "45 Beach Road, Camps Bay",
          email: "bookings@oceangrill.example.com"
        }
      },
      { 
        id: 3, 
        title: "Savanna Bistro", 
        description: "Modern fusion dining combining African and European culinary traditions.", 
        image: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.2,
        contact: {
          phone: "+27 11 345 6789",
          website: "https://savannabistro.example.com",
          address: "78 Nelson Mandela Square, Sandton",
          email: "info@savannabistro.example.com"
        }
      },
      { 
        id: 4, 
        title: "Jozi Eats", 
        description: "Vibrant street food vibes with a modern twist on local favorites.", 
        image: "https://images.pexels.com/photos/2290070/pexels-photo-2290070.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.0,
        contact: {
          phone: "+27 11 456 7890",
          website: "https://jozieats.example.com",
          address: "156 Fox Street, Maboneng",
          email: "eat@jozieats.example.com"
        }
      },
      { 
        id: 5, 
        title: "Vineyard Kitchen", 
        description: "Wine country dining with seasonal ingredients sourced from local farms.", 
        image: "https://images.pexels.com/photos/3887985/pexels-photo-3887985.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.7,
        contact: {
          phone: "+27 21 567 8901",
          website: "https://vineyardkitchen.example.com",
          address: "92 Wine Route, Stellenbosch",
          email: "dine@vineyardkitchen.example.com"
        }
      },
    ],
  },
  {
    id: 2,
    category: "Hotels",
    description: "Luxurious accommodations across South Africa",
    services: [
      { 
        id: 6, 
        title: "Table Mountain Lodge", 
        description: "Luxury accommodations with stunning views of Table Mountain and premium amenities.", 
        image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.9,
        contact: {
          phone: "+27 21 678 9012",
          website: "https://tablemountainlodge.example.com",
          address: "34 Kloof Road, Cape Town",
          email: "reservations@tmlodge.example.com"
        }
      },
      { 
        id: 7, 
        title: "Safari Retreat", 
        description: "Immersive wildlife experience with luxury tented accommodations in the bush.", 
        image: "https://images.pexels.com/photos/3757144/pexels-photo-3757144.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.6,
        contact: {
          phone: "+27 13 789 0123",
          website: "https://safariretreat.example.com",
          address: "Kruger National Park, Mpumalanga",
          email: "stay@safariretreat.example.com"
        }
      },
      { 
        id: 8, 
        title: "Coastal Haven", 
        description: "Beachfront elegance with private access to pristine beaches and ocean activities.", 
        image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.3,
        contact: {
          phone: "+27 31 890 1234",
          website: "https://coastalhaven.example.com",
          address: "15 Marine Drive, Umhlanga",
          email: "book@coastalhaven.example.com"
        }
      },
      { 
        id: 9, 
        title: "Urban Oasis", 
        description: "City-center luxury with easy access to shopping, dining, and cultural attractions.", 
        image: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.4,
        contact: {
          phone: "+27 11 901 2345",
          website: "https://urbanoasis.example.com",
          address: "567 West Street, Johannesburg",
          email: "stay@urbanoasis.example.com"
        }
      },
      { 
        id: 10, 
        title: "Winelands Inn", 
        description: "Charming vineyard stay with wine tastings, gourmet dining, and scenic landscapes.", 
        image: "https://images.pexels.com/photos/600622/pexels-photo-600622.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.8,
        contact: {
          phone: "+27 21 012 3456",
          website: "https://winelandsinn.example.com",
          address: "23 Vineyard Road, Franschhoek",
          email: "reservations@winelandsinn.example.com"
        }
      },
    ],
  },
  {
    id: 3,
    category: "Attractions",
    description: "Must-visit destinations and experiences",
    services: [
      { 
        id: 11, 
        title: "Kruger Safari", 
        description: "Big Five wildlife adventure with expert guides and luxury safari vehicles.", 
        image: "https://images.pexels.com/photos/59989/elephant-herd-of-elephants-africa-wild-animals-59989.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.9,
        contact: {
          phone: "+27 13 123 4567",
          website: "https://krugersafari.example.com",
          address: "Kruger National Park Main Gate",
          email: "bookings@krugersafari.example.com"
        }
      },
      { 
        id: 12, 
        title: "Robben Island", 
        description: "Historical island tour exploring South Africa's apartheid history and Nelson Mandela's imprisonment.", 
        image: "https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.5,
        contact: {
          phone: "+27 21 234 5678",
          website: "https://robbenisland.example.com",
          address: "V&A Waterfront Ferry Terminal",
          email: "tours@robbenisland.example.com"
        }
      },
      { 
        id: 13, 
        title: "Cape Point", 
        description: "Scenic coastal exploration at the southwestern tip of Africa with breathtaking views.", 
        image: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.7,
        contact: {
          phone: "+27 21 345 6789",
          website: "https://capepoint.example.com",
          address: "Cape Point Nature Reserve",
          email: "info@capepoint.example.com"
        }
      },
      { 
        id: 14, 
        title: "Garden Route", 
        description: "Picturesque road trip along South Africa's southern coast with diverse landscapes.", 
        image: "https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.6,
        contact: {
          phone: "+27 44 456 7890",
          website: "https://gardenroute.example.com",
          address: "Garden Route Tourism Office",
          email: "explore@gardenroute.example.com"
        }
      },
      { 
        id: 15, 
        title: "Soweto Tour", 
        description: "Cultural heritage experience exploring the township's historical significance.", 
        image: "https://images.pexels.com/photos/1570610/pexels-photo-1570610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", 
        rating: 4.4,
        contact: {
          phone: "+27 11 567 8901",
          website: "https://sowetotour.example.com",
          address: "Orlando West, Soweto",
          email: "tours@sowetotour.example.com"
        }
      },
    ],
  },
];