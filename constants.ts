
import { Product, Review } from './types';

export const LOGO_URL = 'https://i.ibb.co/C3Xp0Fm/viralyn-logo.png';

const createMockReviews = (productName: string): Review[] => [
  {
    id: 'r1',
    userName: 'Alex Johnson',
    rating: 5,
    comment: `Absolutely love this ${productName} deal. Saved so much money!`,
    date: '2023-10-12'
  },
  {
    id: 'r2',
    userName: 'Sarah Miller',
    rating: 4,
    comment: 'Instant delivery as promised. Smooth setup.',
    date: '2023-11-05'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'netflix-prem',
    name: 'Netflix Premium 4K',
    description: 'Get access to unlimited movies, TV shows, and more. 4K HDR streaming on 4 screens.',
    price: 4.99,
    originalPrice: 19.99,
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&q=80',
    category: 'Streaming',
    rating: 4.9,
    reviews: 1240,
    benefits: ['4K UHD Quality', '4 Simultaneous Screens', 'No Ads', 'All Devices Supported'],
    stock: 'In Stock',
    duration: '1 Month',
    userReviews: createMockReviews('Netflix')
  },
  {
    id: 'spotify-prem',
    name: 'Spotify Premium Family',
    description: 'Millions of songs and podcasts. Play on all your devices. No ad interruptions.',
    price: 2.50,
    originalPrice: 15.99,
    image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=80',
    category: 'Music',
    rating: 4.8,
    reviews: 850,
    benefits: ['Ad-free music', 'Offline playback', 'High quality audio', 'Unlimited skips'],
    stock: 'In Stock',
    duration: '1 Month',
    userReviews: createMockReviews('Spotify')
  },
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus (Shared)',
    description: 'Get the most out of ChatGPT with early access to new features and GPT-4.',
    price: 8.99,
    originalPrice: 20.00,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    category: 'AI',
    rating: 5.0,
    reviews: 2100,
    benefits: ['GPT-4 Access', 'DALL-E 3 Included', 'Faster Response Time', 'Early Feature Access'],
    stock: 'Low Stock',
    duration: '1 Month',
    userReviews: createMockReviews('ChatGPT')
  },
  {
    id: 'youtube-prem',
    name: 'YouTube Premium',
    description: 'Enjoy YouTube and YouTube Music ad-free, offline, and in the background.',
    price: 3.99,
    originalPrice: 13.99,
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    category: 'Streaming',
    rating: 4.7,
    reviews: 640,
    benefits: ['No Ads', 'Background Play', 'YouTube Music Premium', 'Downloads'],
    stock: 'In Stock',
    duration: '1 Month',
    userReviews: createMockReviews('YouTube')
  },
  {
    id: 'xbox-gamepass',
    name: 'Xbox Game Pass Ultimate',
    description: 'Play hundreds of high-quality games on console, PC and cloud.',
    price: 5.99,
    originalPrice: 16.99,
    image: 'https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=800&q=80',
    category: 'Gaming',
    rating: 4.9,
    reviews: 430,
    benefits: ['EA Play Included', 'Cloud Gaming', 'Monthly Rewards', 'Access to Day One Releases'],
    stock: 'In Stock',
    duration: '1 Month',
    userReviews: createMockReviews('Xbox')
  },
  {
    id: 'canva-pro',
    name: 'Canva Pro Lifetime',
    description: 'Design like a professional with premium templates and stock media.',
    price: 12.99,
    originalPrice: 119.99,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80',
    category: 'Productivity',
    rating: 4.8,
    reviews: 920,
    benefits: ['Unlimited Premium Assets', 'Brand Kit', 'One-Click Resize', 'AI Magic Studio'],
    stock: 'In Stock',
    duration: 'Lifetime',
    userReviews: createMockReviews('Canva')
  }
];
