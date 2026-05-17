"use client";

import React from 'react';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import { fetchTrendingProducts, fetchArtisanProducts, Product } from '../data/products';
import SearchFilters from '../components/SearchFilters';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import MagneticButton from '../components/MagneticButton';


export default function HomePage() {
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [artisanProducts, setArtisanProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      fetchTrendingProducts(),
      fetchArtisanProducts()
    ]).then(([trending, artisan]) => {
      setProducts(trending);
      setArtisanProducts(artisan);
      setLoading(false);
    });
  }, []);

  const handleSearchResults = (results: Product[]) => {
    setSearchResults(results);
    setHasSearched(results.length > 0 || (results.length === 0 && isSearching));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Hero />
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-40">
        <div className="flex flex-col mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center mb-16"
          >
            <p className="text-brand-gold text-[10px] md:text-[12px] font-medium uppercase tracking-[0.8em] mb-6 font-sans">Curated for You</p>
            <h2 className="text-4xl md:text-7xl lg:text-8xl font-serif text-brand-blue dark:text-brand-beige leading-tight">
              {searchResults.length > 0 ? 'Search Results' : 'Trending Now'}
            </h2>
            <div className="w-16 h-px bg-brand-gold/40 mt-10"></div>
          </motion.div>

          <div className="flex justify-between items-center mb-12">
            {!hasSearched && (
              <button className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold hover:text-brand-blue dark:hover:text-brand-beige transition-all border-b border-brand-gold/20 hover:border-brand-gold pb-2">
                View All Masterpieces
              </button>
            )}
          </div>

          <SearchFilters 
            onSearch={handleSearchResults} 
            setIsSearching={setIsSearching} 
          />
        </div>
        
        {(loading || isSearching) ? (
          <ProductGrid 
            products={[]} 
            onAddToCart={addToCart} 
            onToggleWishlist={toggleWishlist}
            onProductClick={(product) => router.push(`/product/${product.id}`)}
            wishlist={wishlist}
            isLoading={true}
          />
        ) : (
          <>
            {searchResults.length > 0 ? (
              <ProductGrid 
                products={searchResults} 
                onAddToCart={addToCart} 
                onToggleWishlist={toggleWishlist}
                onProductClick={(product) => router.push(`/product/${product.id}`)}
                wishlist={wishlist}
              />
            ) : hasSearched && !isSearching ? (
              <div className="text-center py-20">
                <p className="text-brand-blue/40 dark:text-brand-beige/40 font-serif italic text-xl">No masterpieces found matching your search.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 text-brand-gold text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <ProductGrid 
                products={products.slice(0, 8)} 
                onAddToCart={addToCart} 
                onToggleWishlist={toggleWishlist}
                onProductClick={(product) => router.push(`/product/${product.id}`)}
                wishlist={wishlist}
              />
            )}
          </>
        )}
      </div>

      {/* Artisan Section */}
      {artisanProducts.length > 0 && (
        <div className="bg-brand-beige/30 dark:bg-white/5 py-24 lg:py-40 border-y border-brand-gold/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col mb-24 text-center">
              <p className="text-brand-gold text-[10px] md:text-[12px] font-medium uppercase tracking-[0.8em] mb-6 font-sans">Hand-Woven Legacy</p>
              <h2 className="text-4xl md:text-7xl lg:text-8xl font-serif text-brand-blue dark:text-brand-beige">The Artisan Collection</h2>
              <div className="w-16 h-px bg-brand-gold/40 mx-auto mt-10"></div>
            </div>

            <ProductGrid 
              products={artisanProducts.slice(0, 4)} 
              onAddToCart={addToCart} 
              onToggleWishlist={toggleWishlist}
              onProductClick={(product) => router.push(`/product/${product.id}`)}
              wishlist={wishlist}
            />
            
            <div className="mt-24 text-center">
              <MagneticButton 
                onClick={() => router.push('/category/sarees')}
                className="inline-block bg-brand-blue dark:bg-brand-beige text-brand-beige dark:text-brand-blue px-12 py-6 text-[10px] font-black uppercase tracking-[0.5em] hover:bg-brand-gold hover:text-white transition-all shadow-2xl"
              >
                Discover the Craft
              </MagneticButton>
            </div>
          </div>
        </div>
      )}

      {/* Brand Story Section */}
      <div className="bg-brand-blue dark:bg-black py-32 lg:py-60 px-6 relative overflow-hidden group">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          poster="/mandala.png"
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-1000 grayscale hover:grayscale-0"
        >
          <source src="/story-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue via-transparent to-brand-blue z-0"></div>



        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          >
            <p className="text-brand-gold text-[10px] md:text-[12px] font-medium uppercase tracking-[1em] mb-16 font-sans">The Navanika Legacy</p>
            <h3 className="text-4xl md:text-7xl lg:text-9xl font-serif text-brand-beige mb-16 leading-[1.1] tracking-tight">Where Heritage Meets <br/> Contemporary Elegance</h3>
            <p className="text-brand-beige/70 text-xl md:text-2xl font-light leading-relaxed italic mb-20 max-w-3xl mx-auto">
              "Navanika is more than a boutique; it is a sanctuary for the modern woman who cherishes the timeless beauty of her heritage. Each piece in our collection is a hand-picked masterpiece, woven with stories of tradition and refined for the global stage."
            </p>
            <div className="w-32 h-px bg-brand-gold/50 mx-auto"></div>
          </motion.div>
        </div>
      </div>


    </motion.div>
  );
}
