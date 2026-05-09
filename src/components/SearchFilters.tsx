"use client";

import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchFiltersProps {
  onSearch: (results: any[]) => void;
  setIsSearching: (loading: boolean) => void;
}

export default function SearchFilters({ onSearch, setIsSearching }: SearchFiltersProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  const categories = ['all', 'Sarees', 'Lehengas', 'Jewelry', 'Artisan'];

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, category, priceRange]);

  const handleSearch = async () => {
    if (!query && category === 'all' && priceRange.min === 0 && priceRange.max === 100000) {
      onSearch([]); // Signal to show default trending products
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: query,
        category: category,
        minPrice: priceRange.min.toString(),
        maxPrice: priceRange.max.toString()
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      onSearch(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full mb-12">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue/30 group-focus-within:text-brand-gold transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search for a masterpiece (e.g., Silk Saree)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 py-4 pl-12 pr-4 rounded-sm outline-none focus:border-brand-gold transition-all font-serif text-lg text-brand-blue dark:text-brand-beige"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-blue/30 hover:text-brand-gold transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-3 px-8 py-4 border transition-all rounded-sm uppercase tracking-widest text-[10px] font-black ${isFilterOpen ? 'bg-brand-gold border-brand-gold text-white' : 'border-brand-blue/10 dark:border-white/10 text-brand-blue dark:text-brand-beige hover:border-brand-gold'}`}
        >
          <SlidersHorizontal size={16} />
          {isFilterOpen ? 'Close Filters' : 'Filters'}
        </button>
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-brand-beige/50 dark:bg-white/5 mt-4 rounded-sm border border-brand-gold/10"
          >
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {/* Category Filter */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-6">By Collection</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-brand-blue text-white shadow-xl scale-105' : 'bg-white dark:bg-black/20 text-brand-blue/60 hover:border-brand-gold border border-transparent'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="lg:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-6">Price Range (₹0 - ₹100k+)</p>
                <div className="flex items-center gap-6">
                  <input 
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                    className="flex-1 accent-brand-gold"
                  />
                  <div className="bg-white dark:bg-black/20 px-4 py-2 border border-brand-blue/10 rounded-sm">
                    <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-beige">Up to ₹{priceRange.max.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
