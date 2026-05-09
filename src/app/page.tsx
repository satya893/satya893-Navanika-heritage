"use client";

import React from 'react';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import { fetchTrendingProducts, fetchArtisanProducts, Product } from '../data/products';
import SearchFilters from '../components/SearchFilters';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useRouter } from 'next/navigation';

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
      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col mb-16">
          <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.6em] mb-4">Curated for You</p>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-blue dark:text-brand-beige">
              {searchResults.length > 0 ? 'Search Results' : 'Trending Now'}
            </h2>
            {!hasSearched && (
              <button className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-gold hover:text-brand-blue dark:hover:text-brand-beige transition-all border-b border-brand-gold pb-1">
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
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full" />
          </div>
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
        <div className="bg-brand-beige/30 dark:bg-white/5 py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col mb-16 text-center">
              <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.6em] mb-4">Hand-Woven Legacy</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-blue dark:text-brand-beige">The Artisan Collection</h2>
              <div className="w-20 h-px bg-brand-gold mx-auto mt-8"></div>
            </div>

            <ProductGrid 
              products={artisanProducts.slice(0, 4)} 
              onAddToCart={addToCart} 
              onToggleWishlist={toggleWishlist}
              onProductClick={(product) => router.push(`/product/${product.id}`)}
              wishlist={wishlist}
            />
            
            <div className="mt-16 text-center">
              <button 
                onClick={() => router.push('/category/sarees')}
                className="bg-brand-blue dark:bg-brand-beige text-brand-beige dark:text-brand-blue px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-gold hover:text-white transition-all shadow-2xl"
              >
                Discover the Craft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brand Story Section */}
      <div className="bg-brand-blue dark:bg-black py-40 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.6em] mb-12">The Navanika Legacy</p>
          <h3 className="text-4xl md:text-5xl lg:text-7xl font-serif text-brand-beige mb-12 leading-tight">Where Heritage Meets Contemporary Elegance</h3>
          <p className="text-brand-beige/60 text-lg font-light leading-relaxed italic mb-16">
            "Navanika is more than a boutique; it is a sanctuary for the modern woman who cherishes the timeless beauty of her heritage. Each piece in our collection is a hand-picked masterpiece, woven with stories of tradition and refined for the global stage."
          </p>
          <div className="w-24 h-px bg-brand-gold mx-auto"></div>
        </div>
      </div>
    </motion.div>
  );
}
