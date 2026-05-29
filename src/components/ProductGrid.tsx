import React from 'react';
import Image from 'next/image';
import { Heart, Plus } from 'lucide-react';
import { Product } from '../data/products';
import { useRouter } from 'next/navigation';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, size?: string) => void;
  onToggleWishlist: (product: Product) => void;
  onProductClick: (product: Product) => void;
  wishlist: any[];
  isLoading?: boolean;
}

export default function ProductGrid({ products, onAddToCart, onToggleWishlist, onProductClick, wishlist, isLoading = false }: ProductGridProps) {
  const router = useRouter();

  // ⚡ Bolt Performance Optimization:
  // Convert wishlist array to a Set of IDs to replace O(N*M) lookup with O(N) lookup.
  // This reduces CPU time during render of long product lists.
  const wishlistedIds = React.useMemo(() => {
    const ids = new Set<string>();
    wishlist.forEach(p => {
      if (p.id) ids.add(p.id);
      if (p.productId) ids.add(p.productId);
    });
    return ids;
  }, [wishlist]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-20">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="relative aspect-[4/5] bg-brand-blue/10 dark:bg-white/10 mb-8 rounded-sm" />
            <div className="text-center px-4 space-y-4 flex flex-col items-center">
              <div className="h-3 w-1/3 bg-[#9E7300]/20 dark:bg-brand-gold/20 rounded-sm" />
              <div className="h-6 w-3/4 bg-brand-blue/10 dark:bg-white/10 rounded-sm" />
              <div className="h-4 w-1/4 bg-brand-blue/10 dark:bg-white/10 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-20">
      {products.map(product => {
        const isWishlisted = wishlistedIds.has(product.id);
        return (
          <div 
            key={product.id} 
            className="group cursor-pointer relative"
            onClick={() => router.push(`/product/${product.id}`)}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-brand-blue/5 dark:bg-white/5 mb-8 transition-all duration-1000 shadow-sm border border-brand-blue/5 dark:border-white/5 group rounded-sm">
              <Image 
                src={product.image} 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-cover transition-all duration-1000 ${product.secondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-110'}`} 
                alt={`Hand-crafted ${product.name} from our ${product.category} collection`} 
              />

              {product.secondaryImage && (
                <Image 
                  src={product.secondaryImage} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-all duration-1000 opacity-0 group-hover:opacity-100 group-hover:scale-110" 
                  alt={`Detailed close-up of ${product.name} weaving and fabric texture`} 
                />

              )}
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }} 
                  className={`w-10 h-10 flex items-center justify-center bg-brand-blue/50 dark:bg-black/50 backdrop-blur-md rounded-full shadow-lg transition-all ${isWishlisted ? 'text-red-500' : 'text-white/40'}`}
                >
                  <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div 
                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                className="absolute bottom-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10"
              >
                 <div className="w-12 h-12 bg-brand-gold text-white flex items-center justify-center shadow-xl rounded-sm"><Plus size={20} /></div>
              </div>
            </div>

            <div className="text-center px-4">
              <p className="text-[#9E7300] dark:text-brand-gold text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] mb-3 font-sans">{product.category}</p>
              <h3 className="font-serif text-xl md:text-2xl mb-3 text-brand-blue dark:text-brand-beige tracking-tight line-clamp-2 min-h-[56px] md:min-h-[64px]">{product.name}</h3>
              <p className="text-brand-blue/60 dark:text-brand-beige/60 text-[11px] tracking-[0.2em] font-light italic">From ₹{product.price.toLocaleString('en-IN')}</p>
            </div>

          </div>
        );
      })}
    </div>
  );
}
