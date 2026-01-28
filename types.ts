
export type Category = 'Streaming' | 'AI' | 'Gaming' | 'Productivity' | 'Music';

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: Category;
  rating: number;
  reviews: number;
  benefits: string[];
  stock: 'In Stock' | 'Low Stock' | 'Out of Stock';
  duration: string;
  userReviews?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
}
