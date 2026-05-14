"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Sparkles, Star, History } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

const CATEGORIES = [
  { 
    id: 'sarees', 
    name: 'Heritage Sarees', 
    description: 'Timeless hand-woven silk and banarasi masterpieces.', 
    image: 'https://images.unsplash.com/photo-1610030469668-3e49e2978393?q=80&w=2000&auto=format&fit=crop',
    count: '60+ Pieces'
  },
  { 
    id: 'formal', 
    name: 'Bridal & Formal', 
    description: 'Exquisite ensembles for your most precious moments.', 
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=2000&auto=format&fit=crop',
    count: '45+ Pieces'
  },
  { 
    id: 'trending', 
    name: 'Trending Now', 
    description: 'The most coveted designs of the current season.', 
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=2000&auto=format&fit=crop',
    count: 'Top 12'
  },
  { 
    id: 'casual', 
    name: 'Casual Elegance', 
    description: 'Refined silhouettes for effortless everyday style.', 
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=2000&auto=format&fit=crop',
    count: '30+ Pieces'
  },
  { 
    id: 'fashion', 
    name: 'Modern Silhouette', 
    description: 'Fusion designs where tradition meets the global stage.', 
    image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=2000&auto=format&fit=crop',
    count: '25+ Pieces'
  },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-beige dark:bg-brand-blue pt-32 pb-24 px-6 transition-colors">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 text-center">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-gold text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] mb-6 font-sans"
          >
            The Atelier Directory
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif text-brand-blue dark:text-brand-beige mb-10 tracking-tight"
          >
            Browse Collections
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto group"
          >
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-blue/30 dark:text-brand-beige/30 group-focus-within:text-brand-gold transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search by collection or style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 py-5 pl-16 pr-8 rounded-full outline-none focus:border-brand-gold transition-all font-serif text-lg text-brand-blue dark:text-brand-beige shadow-sm"
            />
          </motion.div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCategories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 3) }}
              onClick={() => router.push(`/category/${cat.id}`)}
              className="group cursor-pointer relative h-[350px] overflow-hidden rounded-2xl border border-brand-blue/5 dark:border-white/5 shadow-xl bg-white dark:bg-white/5"
            >
              <Image 
                src={cat.image} 
                alt={cat.name}
                fill
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105 opacity-60 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-brand-blue/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700" />
              
              <div className="absolute inset-0 p-10 flex flex-col justify-end transition-transform duration-700 group-hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-[1px] w-8 bg-brand-gold"></span>
                  <span className="text-[10px] uppercase tracking-widest font-black text-brand-gold">{cat.count}</span>
                </div>
                <h3 className="text-3xl font-serif text-white mb-3 group-hover:text-brand-gold transition-colors">{cat.name}</h3>
                <p className="text-white/70 text-sm italic font-light leading-relaxed max-w-xs transition-opacity duration-700 group-hover:text-white">
                  "{cat.description}"
                </p>
                <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-brand-gold opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                  Enter Collection <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="mx-auto text-brand-gold/30 mb-6" size={48} />
            <p className="text-brand-blue/40 dark:text-brand-beige/40 font-serif italic text-xl">No collections match your search.</p>
          </div>
        )}

        <footer className="mt-24 pt-16 border-t border-brand-blue/5 dark:border-white/5 text-center">
          <div className="flex flex-wrap justify-center gap-12 items-center opacity-40">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-brand-gold" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Premium Silk Audit</span>
            </div>
            <div className="flex items-center gap-2">
              <History size={14} className="text-brand-gold" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Heritage Preservation</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
