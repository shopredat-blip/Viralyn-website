
import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { 
  ShoppingCart, Search, X, Star, Zap, ShieldCheck, 
  Headphones, Gift, CreditCard, ChevronRight, Sparkles, 
  TrendingUp, Heart, Filter, ArrowUpDown, ChevronDown,
  Plus, Minus, History, Share2, MessageSquare, Send, Check, Trash2
} from 'lucide-react';
import { Product, CartItem, Category, Review } from './types';
import { PRODUCTS } from './constants';
import { getProductInsight, getSmartRecommendations } from './geminiService';

// --- Types ---
type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'name';

// --- Helper Components ---

/**
 * Optimized Image component using IntersectionObserver for true lazy loading 
 * and shimmer skeletons for better UX.
 */
const LazyImage: React.FC<{ src: string, alt: string, className?: string }> = ({ src, alt, className = "" }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '200px' } 
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${!isLoaded ? 'shimmer' : 'bg-zinc-800'} ${className}`}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-600/10 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components Interfaces ---

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onSearch: (q: string) => void;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product, q: number) => void;
  onQuickView: (p: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
}

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, q: number) => void;
  onAddReview: (productId: string, review: Review) => void;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, q: number) => void;
  removeFromCart: (id: string) => void;
  onAddToCart: (p: Product, q: number) => void;
  recentlyViewed: Product[];
  onClearHistory: () => void;
}

// --- Sub-components ---

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onSearch }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-3 shadow-lg border-b border-red-900/30' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white text-xl italic shadow-lg shadow-red-600/20">V</div>
          <span className="text-2xl font-extrabold tracking-tighter uppercase italic hidden sm:block">Viralyn</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#" className="hover:text-red-500 transition-colors">Home</a>
          <a href="#shop" className="hover:text-red-500 transition-colors">Shop</a>
          <a href="#features" className="hover:text-red-500 transition-colors">Why Us</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 w-32 md:w-48 transition-all"
            />
          </div>
          <button onClick={onCartClick} className="relative p-2 text-gray-300 hover:text-white transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

const ProductCard: React.FC<ProductCardProps> = memo(({ product, onAddToCart, onQuickView, isWishlisted, onToggleWishlist }) => {
  const [qty, setQty] = useState(1);
  const [shared, setShared] = useState(false);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.href + '?p=' + product.id;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [product.id, product.name, product.description]);

  return (
    <div className="group bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-900/50 transition-all duration-500 flex flex-col relative">
      <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => onQuickView(product)}>
        <LazyImage src={product.image} alt={product.name} className="w-full h-full group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-red-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white shadow-lg">SALE -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>
          {product.stock === 'Low Stock' && <span className="bg-orange-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white shadow-lg">Limited</span>}
        </div>
        
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
            className={`p-2 backdrop-blur-md rounded-full transition-all ${isWishlisted ? 'bg-red-600 text-white' : 'bg-black/40 text-white/70 hover:text-red-500 hover:bg-black/60'}`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-red-500 hover:bg-black/60 transition-all relative"
          >
            {shared ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {shared && <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-green-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">Copied!</span>}
          </button>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{product.category}</span>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-semibold text-gray-300">{product.rating}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-bold mb-2 group-hover:text-red-500 transition-colors leading-tight">{product.name}</h3>
        
        <div className="relative group/desc">
          <p className="text-gray-400 text-xs mb-4 line-clamp-2 cursor-help">{product.description}</p>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/desc:block z-50 w-full p-3 bg-zinc-800 text-white text-[11px] rounded-xl border border-zinc-700 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            {product.description}
            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 rotate-45" />
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-gray-500 text-xs line-through">${product.originalPrice.toFixed(2)}</span>
                <span className="text-xl font-black text-white">${product.price.toFixed(2)}<span className="text-[10px] text-gray-400 font-normal ml-1">/{product.duration}</span></span>
              </div>
              <div className="flex items-center bg-zinc-800/50 rounded-lg p-1 border border-zinc-700/50">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1 hover:text-red-500 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="p-1 hover:text-red-500 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
          </div>
          
          <button 
            onClick={() => { onAddToCart(product, qty); setQty(1); }}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2 text-white font-bold text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
});

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, onAddToCart, onAddReview }) => {
  const [insight, setInsight] = useState<string>('Loading AI insight...');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  useEffect(() => {
    getProductInsight(product.name).then(setInsight);
  }, [product.name]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      userName: 'Demo User',
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString().split('T')[0]
    };

    onAddReview(product.id, newReview);
    setReviewComment('');
    setReviewRating(5);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 h-[90vh] flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-white transition-colors bg-black/50 rounded-full">
          <X className="w-6 h-6" />
        </button>
        
        <div className="relative h-64 md:h-full md:w-1/2 flex-shrink-0">
          <LazyImage src={product.image} alt={product.name} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/20 via-transparent to-transparent" />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-zinc-800 pt-12 px-8">
            <button 
              onClick={() => setActiveTab('info')}
              className={`pb-4 px-4 font-bold text-sm uppercase tracking-widest transition-all relative ${activeTab === 'info' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Info
              {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 px-4 font-bold text-sm uppercase tracking-widest transition-all relative ${activeTab === 'reviews' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Reviews ({product.userReviews?.length || 0})
              {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            {activeTab === 'info' ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <span className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2 block">{product.category}</span>
                <h2 className="text-3xl md:text-4xl font-black mb-4">{product.name}</h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
                    ))}
                    <span className="ml-2 text-gray-300 font-medium">{product.rating}</span>
                  </div>
                  <div className="h-4 w-px bg-zinc-800" />
                  <div className={`flex items-center gap-2 text-xs font-bold ${product.stock === 'In Stock' ? 'text-green-500' : 'text-orange-500'}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {product.stock}
                  </div>
                </div>

                <p className="text-gray-400 mb-8 leading-relaxed">{product.description}</p>
                
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-8">
                  <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-2">
                    <Sparkles className="w-4 h-4" />
                    Viralyn AI Insight
                  </div>
                  <p className="text-gray-300 italic text-sm">"{insight}"</p>
                </div>

                <div className="space-y-3 mb-8">
                  {product.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                      <ShieldCheck className="w-5 h-5 text-red-500 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-4 mb-8">
                  <div className="flex flex-col">
                    <span className="text-gray-500 line-through text-sm">${product.originalPrice.toFixed(2)}</span>
                    <span className="text-4xl font-black text-white">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-2 ml-4">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 text-zinc-400 hover:text-white"><Minus className="w-4 h-4" /></button>
                    <span className="w-10 text-center font-bold">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="px-2 text-zinc-400 hover:text-white"><Plus className="w-4 h-4" /></button>
                  </div>
                  <span className="text-zinc-600 pb-2 ml-2">/ {product.duration}</span>
                </div>

                <button 
                  onClick={() => {
                    onAddToCart(product, qty);
                    onClose();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 group"
                >
                  Add to Cart
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-500" /> Community Reviews
                  </h3>
                  
                  <form onSubmit={handleSubmitReview} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
                    <p className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-widest">Share your experience</p>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          type="button" 
                          onClick={() => setReviewRating(star)}
                          className={`transition-all ${reviewRating >= star ? 'text-yellow-500' : 'text-zinc-700 hover:text-zinc-500'}`}
                        >
                          <Star className={`w-5 h-5 ${reviewRating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="What did you think of this product?"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-600 min-h-[100px] mb-4"
                    />
                    <button 
                      type="submit"
                      disabled={!reviewComment.trim()}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center gap-2 ml-auto"
                    >
                      <Send className="w-4 h-4" /> Submit Review
                    </button>
                  </form>

                  <div className="space-y-6">
                    {product.userReviews && product.userReviews.length > 0 ? (
                      product.userReviews.map(rev => (
                        <div key={rev.id} className="border-b border-zinc-900 pb-6 last:border-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-white">{rev.userName}</p>
                              <div className="flex gap-1 text-yellow-500 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : ''}`} />
                                ))}
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{rev.date}</span>
                          </div>
                          <p className="text-zinc-400 text-sm leading-relaxed">{rev.comment}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <MessageSquare className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-20" />
                        <p className="text-zinc-500 font-medium italic">No reviews yet. Be the first!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-6 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
            <div className="flex items-center gap-1"><Zap className="w-3 h-3" /> Auto Renewal</div>
            <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Safe & Secure</div>
            <div className="flex items-center gap-1"><Headphones className="w-3 h-3" /> 24/7 Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, cart, updateQuantity, removeFromCart, onAddToCart, recentlyViewed, onClearHistory }) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  useEffect(() => {
    if (isOpen && cart.length > 0) {
      setLoadingRecs(true);
      const userInterests = cart.map(item => item.name).join(', ');
      getSmartRecommendations(userInterests).then(names => {
        const suggested = PRODUCTS.filter(p => 
          names.some(n => p.name.toLowerCase().includes(n.toLowerCase())) &&
          !cart.some(c => c.id === p.id)
        ).slice(0, 3); 
        setRecommendations(suggested);
        setLoadingRecs(false);
      });
    } else {
      setRecommendations([]);
    }
  }, [isOpen, cart.length]);

  const handleRemove = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeFromCart(id);
      setRemovingId(null);
    }, 300);
  }, [removeFromCart]);

  const handleAddAll = useCallback(() => {
    recommendations.forEach(p => onAddToCart(p, 1));
    setRecommendations([]);
  }, [recommendations, onAddToCart]);

  return (
    <div className={`fixed inset-0 z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Sticky Header */}
          <div className="p-6 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md z-10">
            <h2 className="text-2xl font-black">Shopping Cart</h2>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-medium">Your cart is empty</p>
                <button onClick={onClose} className="mt-4 text-red-500 font-bold hover:underline">Continue Shopping</button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-10">
                  {cart.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 transition-all duration-300 ${removingId === item.id ? 'opacity-0 -translate-x-8' : 'opacity-100 translate-x-0'}`}
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <LazyImage src={item.image} alt={item.name} className="w-full h-full" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                          <button onClick={() => handleRemove(item.id)} className="text-zinc-500 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-zinc-500 text-[10px] mb-2">{item.duration}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-zinc-800 rounded-lg overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-zinc-800 text-zinc-400">-</button>
                            <span className="px-3 text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-zinc-800 text-zinc-400">+</button>
                          </div>
                          <span className="font-black text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {recentlyViewed.length > 0 && (
                  <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <History className="w-4 h-4" /> Recently Viewed
                      </div>
                      <button 
                        onClick={onClearHistory}
                        className="text-[10px] font-bold text-zinc-600 hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Clear History
                      </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
                      {recentlyViewed.map(p => (
                        <div key={p.id} className="min-w-[140px] bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2 group snap-start transition-transform active:scale-95">
                           <div className="relative w-full h-24 rounded-xl overflow-hidden">
                             <LazyImage src={p.image} alt={p.name} className="w-full h-full transition-transform duration-500 group-hover:scale-110" />
                           </div>
                           <h5 className="text-[10px] font-bold text-white line-clamp-1 group-hover:text-red-500 transition-colors">{p.name}</h5>
                           <div className="flex items-center justify-between mt-auto">
                             <span className="text-[10px] font-black text-white">${p.price.toFixed(2)}</span>
                             <button 
                                onClick={() => onAddToCart(p, 1)}
                                className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white p-2 rounded-lg transition-all"
                             >
                               <ShoppingCart className="w-3.5 h-3.5" />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(recommendations.length > 0 || loadingRecs) && (
                  <div className="mt-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest">
                        <Sparkles className="w-4 h-4" /> AI Suggested
                      </div>
                      {!loadingRecs && recommendations.length > 0 && (
                        <button 
                          onClick={handleAddAll}
                          className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg"
                        >
                          Add All <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {loadingRecs ? (
                      <div className="space-y-3">
                        <div className="h-20 bg-zinc-800/50 rounded-xl animate-pulse" />
                        <div className="h-20 bg-zinc-800/50 rounded-xl animate-pulse" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recommendations.map(p => (
                          <div key={p.id} className="flex items-center gap-3 group">
                            <LazyImage src={p.image} alt={p.name} className="w-12 h-12 rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[11px] font-bold text-white leading-tight line-clamp-1">{p.name}</h5>
                              <p className="text-[10px] text-zinc-500">${p.price.toFixed(2)}</p>
                            </div>
                            <button 
                              onClick={() => onAddToCart(p, 1)}
                              className="bg-zinc-800 hover:bg-red-600 p-2 rounded-lg transition-colors text-white"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sticky Footer */}
          {cart.length > 0 && (
            <div className="p-6 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-500 font-medium uppercase tracking-widest text-[10px] font-bold">Subtotal Amount</span>
                <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
              </div>
              <button className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 mb-3 shadow-lg shadow-red-600/20 active:scale-[0.98]">
                Secure Checkout
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-600 uppercase tracking-widest font-black">
                <ShieldCheck className="w-3 h-3 text-green-500" /> 
                SSL Encrypted Payment
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  
  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [minRating, setMinRating] = useState<number>(0);
  const [stockOnly, setStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showFilters, setShowFilters] = useState(false);

  // Persistence Initialization
  useEffect(() => {
    const savedWishlist = localStorage.getItem('viralyn_wishlist');
    const savedRecently = localStorage.getItem('viralyn_recently');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedRecently) setRecentlyViewedIds(JSON.parse(savedRecently));
  }, []);

  // Update localStorage on changes
  useEffect(() => {
    localStorage.setItem('viralyn_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('viralyn_recently', JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesRating = p.rating >= minRating;
      const matchesStock = !stockOnly || p.stock === 'In Stock';
      return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesStock;
    });

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }

    return result;
  }, [products, searchQuery, activeCategory, priceRange, minRating, stockOnly, sortBy]);

  const trackRecentlyViewed = useCallback((p: Product) => {
    setRecentlyViewedIds(prev => {
      const filtered = prev.filter(id => id !== p.id);
      return [p.id, ...filtered].slice(0, 10);
    });
  }, []);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity: quantity }];
    });
    trackRecentlyViewed(product);
    setIsCartOpen(true);
  }, [trackRecentlyViewed]);

  const updateQuantity = useCallback((id: string, q: number) => {
    if (q <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: q } : item));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const openQuickView = useCallback((p: Product) => {
    setSelectedProduct(p);
    trackRecentlyViewed(p);
  }, [trackRecentlyViewed]);

  const handleAddReview = useCallback((productId: string, review: Review) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedReviews = [review, ...(p.userReviews || [])];
        const newRating = Number((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));
        return { 
          ...p, 
          userReviews: updatedReviews, 
          rating: newRating,
          reviews: (p.reviews || 0) + 1 
        };
      }
      return p;
    }));
    setSelectedProduct(prev => {
      if (prev && prev.id === productId) {
        const updatedReviews = [review, ...(prev.userReviews || [])];
        const newRating = Number((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));
        return { ...prev, userReviews: updatedReviews, rating: newRating, reviews: (prev.reviews || 0) + 1 };
      }
      return prev;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentlyViewedIds([]);
  }, []);

  const recentProductsData = useMemo(() => {
    return recentlyViewedIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  }, [recentlyViewedIds, products]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-red-600 selection:text-white">
      <Navbar 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)}
        onSearch={setSearchQuery}
      />

      <main className="flex-grow pt-24 pb-20">
        <section className="container mx-auto px-4 md:px-8 mb-20">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-zinc-800 p-8 md:p-20 text-center md:text-left">
            <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-red-600 blur-[150px] rounded-full" />
              <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-red-900 blur-[150px] rounded-full" />
            </div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-red-500 text-xs font-extrabold uppercase tracking-widest mb-6">
                  <TrendingUp className="w-4 h-4" /> Best Price Guarantee
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tighter">
                  LEVEL UP YOUR <br />
                  <span className="gradient-text italic">DIGITAL LIFE</span>
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
                  Premium subscriptions for Netflix, Spotify, ChatGPT and more. Instant delivery, lowest prices, and 24/7 priority support.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="#shop" className="bg-red-600 hover:bg-red-700 text-white font-black px-10 py-5 rounded-2xl transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-3">
                    Shop Deals Now <ChevronRight className="w-5 h-5" />
                  </a>
                  <div className="flex items-center gap-4 px-6 py-5 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-sm">
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/40/40?random=${i}`} className="w-8 h-8 rounded-full border-2 border-zinc-900" />)}
                    </div>
                    <span className="text-xs font-bold text-zinc-300">12K+ Happy Customers</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <img 
                    src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80" 
                    alt="Hero" 
                    className="relative rounded-3xl border border-zinc-700 shadow-2xl transition-transform duration-700 group-hover:rotate-1 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="shop" className="container mx-auto px-4 md:px-8 mb-16 scroll-mt-24">
          <div className="flex flex-col gap-8 mb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <h2 className="text-4xl font-black">Browse Products</h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {['All', 'Streaming', 'Music', 'AI', 'Productivity', 'Gaming'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat as any)}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
                      activeCategory === cat ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between bg-zinc-900/50 border border-zinc-800 p-4 rounded-[2rem] gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${showFilters ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  <Filter className="w-4 h-4" /> Filters
                </button>
                <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-zinc-800/30 rounded-2xl text-xs font-bold text-zinc-500">
                  <TrendingUp className="w-3 h-3 text-red-500" /> 
                  Showing {filteredProducts.length} Results
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group/sort">
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 rounded-2xl text-sm font-bold text-zinc-400 cursor-pointer group-hover/sort:text-white transition-all">
                    <ArrowUpDown className="w-4 h-4" />
                    <span>Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1).replace('-', ' ')}</span>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all z-20 overflow-hidden">
                    {[
                      { val: 'featured', label: 'Featured' },
                      { val: 'price-low', label: 'Price: Low to High' },
                      { val: 'price-high', label: 'Price: High to Low' },
                      { val: 'rating', label: 'Best Rating' },
                      { val: 'name', label: 'Product Name' }
                    ].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => setSortBy(opt.val as SortOption)}
                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${sortBy === opt.val ? 'bg-red-600 text-white' : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-red-500" /> Max Price: ${priceRange[1]}
                  </label>
                  <input 
                    type="range" min="0" max="50" step="5"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                    <span>$0</span><span>$25</span><span>$50</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" /> Min Rating: {minRating}+ Stars
                  </label>
                  <div className="flex gap-2">
                    {[0, 3, 4, 5].map(r => (
                      <button 
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${minRating === r ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                      >
                        {r === 0 ? 'All' : `${r}★`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" /> Stock Status
                  </label>
                  <button 
                    onClick={() => setStockOnly(!stockOnly)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${stockOnly ? 'bg-green-600/10 border-green-600 text-green-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${stockOnly ? 'bg-green-500' : 'bg-zinc-600'}`} />
                    {stockOnly ? 'In Stock Only' : 'Show All Stock'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart} 
                onQuickView={openQuickView} 
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-zinc-950 border-t border-zinc-900 pt-20 pb-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white text-xl italic">V</div>
                <span className="text-2xl font-extrabold tracking-tighter uppercase italic">Viralyn</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                The world's premier destination for high-quality digital subscriptions at unbeatable prices.
              </p>
              <div className="flex items-center gap-4">
                {['FB', 'TW', 'IG'].map(s => (
                  <a key={s} href="#" className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-xs font-bold text-zinc-400 hover:text-red-500 hover:border-red-500 transition-all">
                    {s}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Categories</h4>
              <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                <li><a href="#" className="hover:text-red-500 transition-colors">Streaming</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Music</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">AI & Development</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Support</h4>
              <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                <li><a href="#" className="hover:text-red-500 transition-colors">Refund Policy</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Safe Shopping</h4>
              <p className="text-zinc-500 text-xs mb-6">Encrypted secure payments for all transactions.</p>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-bold text-zinc-600">VISA</div>
                <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-bold text-zinc-600">PAYPAL</div>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-zinc-900 text-center text-[10px] uppercase font-bold tracking-widest text-zinc-600">
            © 2024 Viralyn Digital. All Rights Reserved.
          </div>
        </div>
      </footer>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        onAddToCart={addToCart}
        recentlyViewed={recentProductsData}
        onClearHistory={clearHistory}
      />

      {selectedProduct && (
        <QuickViewModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart}
          onAddReview={handleAddReview}
        />
      )}
    </div>
  );
}
