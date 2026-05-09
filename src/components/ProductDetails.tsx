import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, Heart, Star, ShieldCheck, Truck, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
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
      className="max-w-7xl mx-auto px-6 py-20"
    >
      <button 
        onClick={onBack} 
        className="flex items-center gap-4 text-brand-gold mb-12 hover:text-brand-blue dark:hover:text-brand-beige transition-all group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-black">Back to Atelier</span>
      </button>

      <div className="grid lg:grid-cols-2 gap-20 items-start">
        {/* Image Section */}
        <div className="sticky top-40 z-10">
          <div 
            ref={imgContainerRef}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            className="relative aspect-[3/4] overflow-hidden bg-brand-blue/5 dark:bg-white/5 shadow-2xl rounded-sm border border-brand-blue/5 dark:border-white/5 cursor-zoom-in"
          >
            <Image 
              src={product.image} 
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-200 ease-out" 
              style={{
                transform: isZoomed ? `scale(2)` : `scale(1)`,
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
              }}
              alt={product.name} 
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4">{product.category}</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-blue dark:text-brand-beige mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-6">
                <p className="text-3xl font-light text-brand-blue/60 dark:text-brand-beige/60 italic">${product.price.toFixed(2)}</p>
                <div className="flex items-center gap-1 text-brand-gold">
                  <Star size={14} fill="currentColor" />
                  <span className="text-[10px] font-bold tracking-widest">4.9 (120 Reviews)</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onToggleWishlist(product)}
              className={`p-4 rounded-full border transition-all ${
                isWishlisted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'border-brand-blue/10 dark:border-brand-beige/10 text-brand-blue/20 dark:text-brand-beige/20 hover:text-brand-blue dark:hover:text-brand-beige'
              }`}
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="mb-12 space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-gold">The Narrative</h4>
            <p className="text-brand-blue/60 dark:text-brand-beige/40 leading-relaxed font-light italic text-lg">
              {product.description}
            </p>
            <p className="text-brand-blue/40 dark:text-brand-beige/40 leading-relaxed font-light text-sm">
              Crafted with the finest materials and centuries-old techniques, this piece embodies the spirit of Navanika. Every stitch tells a story of heritage, elegance, and timeless beauty.
            </p>
          </div>

          <div className="mb-12">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-gold mb-6">Select Size</h4>
            <div className="flex gap-4">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 flex items-center justify-center border text-[10px] font-bold transition-all ${
                    selectedSize === size 
                      ? 'bg-brand-gold border-brand-gold text-white' 
                      : 'border-brand-blue/10 dark:border-brand-beige/10 text-brand-blue/40 dark:text-brand-beige/40 hover:border-brand-blue/40 dark:hover:border-brand-beige/40'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 py-8 border-y border-brand-blue/5 dark:border-brand-beige/5">
            <div className="flex flex-col items-center text-center gap-3">
              <Truck size={20} className="text-brand-gold" />
              <span className="text-[8px] uppercase tracking-widest font-bold text-brand-blue/40 dark:text-brand-beige/40">Global Express</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <ShieldCheck size={20} className="text-brand-gold" />
              <span className="text-[8px] uppercase tracking-widest font-bold text-brand-blue/40 dark:text-brand-beige/40">Heritage Audit</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <RotateCcw size={20} className="text-brand-gold" />
              <span className="text-[8px] uppercase tracking-widest font-bold text-brand-blue/40 dark:text-brand-beige/40">Easy Returns</span>
            </div>
          </div>

            <div className="space-y-6">
              <button 
                onClick={() => onAddToCart(product, selectedSize)}
                className="w-full bg-brand-gold text-white font-bold py-6 rounded-sm hover:bg-brand-blue dark:hover:bg-brand-beige dark:hover:text-brand-blue transition-all shadow-2xl flex items-center justify-center gap-6 group"
              >
                <ShoppingBag size={20} />
                <span className="text-[10px] uppercase tracking-[0.4em]">Acquire This Piece</span>
              </button>
              
              <button 
                onClick={() => onOpenModelingStudio(product)}
                className="w-full border border-brand-gold text-brand-gold font-bold py-6 rounded-sm hover:bg-brand-gold hover:text-white transition-all shadow-xl flex items-center justify-center gap-6 group"
              >
                <Sparkles size={20} />
                <span className="text-[10px] uppercase tracking-[0.4em]">Personal Modeling Studio</span>
              </button>

              <p className="text-center text-[9px] text-brand-blue/20 dark:text-brand-beige/20 uppercase tracking-[0.3em] font-medium">
                Secure checkout • Complimentary shipping on all orders
              </p>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
