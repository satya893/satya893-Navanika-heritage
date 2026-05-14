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
}

export default function ProductGrid({ products, onAddToCart, onToggleWishlist, onProductClick, wishlist }: ProductGridProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-20">
      {products.map(product => {
        const isWishlisted = wishlist.some(p => p.id === product.id || p.productId === product.id);
        return (
          <div 
            key={product.id} 
            className="group cursor-pointer relative"
            onClick={() => router.push(`/product/${product.id}`)}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-brand-blue/5 dark:bg-white/5 mb-8 transition-all duration-1000 shadow-sm border border-brand-blue/5 dark:border-white/5 group">
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
                 <div className="w-12 h-12 bg-brand-gold text-white flex items-center justify-center shadow-xl"><Plus size={20} /></div>
              </div>
            </div>

            <div className="text-center px-4">
              <p className="text-brand-gold text-[9px] md:text-[10px] font-medium uppercase tracking-[0.5em] mb-3 font-sans opacity-80">{product.category}</p>
              <h3 className="font-serif text-xl md:text-2xl mb-3 text-brand-blue dark:text-brand-beige tracking-tight">{product.name}</h3>
              <p className="text-brand-blue/60 dark:text-brand-beige/60 text-[11px] tracking-[0.2em] font-light italic">From ${product.price.toFixed(2)}</p>
            </div>

          </div>
        );
      })}
    </div>
  );
}
