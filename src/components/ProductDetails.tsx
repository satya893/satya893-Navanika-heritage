import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, Heart, Star, ShieldCheck, Truck, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Product } from '../data/products';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, size?: string) => void;
  onToggleWishlist: (product: Product) => void;
  onOpenModelingStudio: (product: Product) => void;
  isWishlisted: boolean;
}

export default function ProductDetails({ product, onBack, onAddToCart, onToggleWishlist, onOpenModelingStudio, isWishlisted }: ProductDetailsProps) {
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const sizes = ['S', 'M', 'L', 'XL'];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current) return;
    const { left, top, width, height } = imgContainerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-20"
    >
      <button 
        onClick={onBack} 
        className="flex items-center gap-4 text-brand-gold mb-6 md:mb-8 hover:text-brand-blue dark:hover:text-brand-beige transition-all group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-black">Back to Atelier</span>
      </button>

      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 md:gap-16 items-start">
        {/* Image Section - Refined Scale */}
        <div className="lg:sticky lg:top-24 z-10">
          <div 
            ref={imgContainerRef}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            className="relative aspect-[3/4] w-full overflow-hidden bg-transparent shadow-2xl rounded-sm cursor-zoom-in group"
          >
              <Image 
                src={product.image} 
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out" 
                style={{
                  transform: isZoomed ? `scale(2.5)` : `scale(1)`,
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                }}
                alt={`High-resolution view of ${product.name}`} 
              />
              {/* Deep Zoom Lens Overlay */}
              <AnimatePresence>
                {isZoomed && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none border-[20px] border-black/10 mix-blend-overlay"
                  />
                )}
              </AnimatePresence>
              
              {/* Floating Wishlist Button on Image for Mobile */}
              <button aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() => onToggleWishlist(product)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all lg:hidden ${
                  isWishlisted ? 'bg-red-500 text-white shadow-lg' : 'bg-white/20 border border-white/20 text-white'
                }`}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
        </div>

        {/* Info Section - Premium Details */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-8 md:mb-12">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-brand-gold text-[9px] font-black uppercase tracking-[0.4em] px-3 py-1 border border-brand-gold/30 rounded-sm">{product.category}</span>
                <div className="flex items-center gap-1 text-brand-gold bg-brand-gold/5 px-3 py-1 rounded-sm border border-brand-gold/10">
                  <Star size={12} fill="currentColor" />
                  <span className="text-[9px] font-black tracking-widest uppercase">4.9 Rare Find</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif text-brand-blue dark:text-brand-beige mb-6 leading-[1.1] tracking-tight">{product.name}</h1>
              <p className="text-3xl md:text-4xl font-serif text-brand-gold">₹{product.price.toLocaleString('en-IN')}</p>
            </div>
            <button aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => onToggleWishlist(product)}
              className={`hidden lg:flex p-5 rounded-full border transition-all duration-500 ${
                isWishlisted 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-lg' 
                  : 'border-brand-blue/10 dark:border-white/10 text-brand-blue/20 dark:text-brand-beige/20 hover:border-brand-gold hover:text-brand-gold'
              }`}
            >
              <Heart size={24} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Luxury Description */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] w-8 bg-brand-gold"></div>
              <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-gold">The Narrative</h4>
            </div>
            <p className="text-brand-blue dark:text-brand-beige leading-relaxed font-serif text-lg md:text-xl italic mb-6">
              "{product.description}"
            </p>
            <div className="p-6 bg-brand-blue/5 dark:bg-white/5 border-l-2 border-brand-gold rounded-r-sm">
              <p className="text-brand-blue/60 dark:text-brand-beige/60 leading-relaxed text-sm">
                Each thread in this masterpiece represents a lineage of Indian excellence. Handcrafted over 120 hours using traditional techniques preserved through generations.
              </p>
            </div>
          </div>

          {/* Details Tabs/Lists */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-gold/60 mb-4">Specifications</h4>
              <ul className="space-y-2">
                {['Pure Silk Base', 'Zari Border', 'Hand-woven', 'Dry Clean Only'].map(spec => (
                  <li key={spec} className="flex items-center gap-2 text-[10px] font-bold text-brand-blue/60 dark:text-brand-beige/40">
                    <div className="w-1 h-1 rounded-full bg-brand-gold" /> {spec}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-brand-gold/60 mb-4">Size & Fit</h4>
              <div className="flex gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 flex items-center justify-center border text-[9px] font-black transition-all rounded-sm ${
                      selectedSize === size 
                        ? 'bg-brand-gold border-brand-gold text-white shadow-lg' 
                        : 'border-brand-blue/10 dark:border-white/10 text-brand-blue/40 dark:text-brand-beige/40 hover:border-brand-gold'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 mb-12 py-8 border-y border-brand-blue/10 dark:border-white/10">
            {[
              { icon: Truck, label: 'Global Express' },
              { icon: ShieldCheck, label: 'Authentic Heritage' },
              { icon: RotateCcw, label: 'Bespoke Returns' }
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <badge.icon size={20} className="text-brand-gold" />
                <span className="text-[8px] uppercase tracking-[0.2em] font-black text-brand-blue/40 dark:text-brand-beige/40 leading-tight">{badge.label}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons - High Fidelity */}
          <div className="space-y-4">
            <button 
              onClick={() => onAddToCart(product, selectedSize)}
              className="group relative w-full bg-brand-gold text-white font-black py-7 rounded-sm overflow-hidden transition-all shadow-[0_15px_35px_rgba(184,142,47,0.3)]"
            >
              <div className="absolute inset-0 bg-brand-blue translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <div className="relative z-10 flex items-center justify-center gap-6">
                <ShoppingBag size={20} />
                <span className="text-[11px] uppercase tracking-[0.4em]">Acquire This Piece</span>
              </div>
            </button>
            
            <button 
              onClick={() => onOpenModelingStudio(product)}
              className="group relative w-full border border-brand-gold text-brand-gold font-black py-7 rounded-sm overflow-hidden transition-all shadow-[0_15px_35px_rgba(184,142,47,0.1)]"
            >
              <div className="absolute inset-0 bg-brand-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <div className="relative z-10 flex items-center justify-center gap-6 group-hover:text-white transition-colors duration-500">
                <Sparkles size={20} />
                <span className="text-[11px] uppercase tracking-[0.4em]">AI Virtual Trial Room</span>
              </div>
            </button>

            <div className="flex items-center justify-center gap-4 pt-4 opacity-40">
              <div className="h-[1px] flex-1 bg-brand-gold/30"></div>
              <p className="text-[8px] uppercase tracking-[0.5em] font-bold">Secure Heritage Checkout</p>
              <div className="h-[1px] flex-1 bg-brand-gold/30"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
