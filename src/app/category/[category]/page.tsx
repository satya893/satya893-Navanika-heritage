"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchProducts, fetchTrendingProducts, Product } from '../../../data/products';
import ProductGrid from '../../../components/ProductGrid';
import { motion } from 'motion/react';
import { useApp } from '../../../context/AppContext';

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    setLoading(true);
    if (category === 'trending') {
      fetchTrendingProducts().then(data => { setProducts(data); setLoading(false); });
    } else {
      fetchProducts(category).then(data => { setProducts(data); setLoading(false); });
    }
  }, [category]);

  const title = category?.charAt(0).toUpperCase() + category?.slice(1);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-6 py-32"
    >
      <div className="mb-16">
        <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.6em] mb-4 block">Curated Collections</p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-blue dark:text-brand-beige">{title}</h2>
      </div>
      
      {loading ? (
        <ProductGrid 
          products={[]} 
          onAddToCart={addToCart} 
          onToggleWishlist={toggleWishlist}
          onProductClick={(product) => router.push(`/product/${product.id}`)}
          wishlist={wishlist}
          isLoading={true}
        />
      ) : (
        <ProductGrid 
          products={products} 
          onAddToCart={addToCart} 
          onToggleWishlist={toggleWishlist}
          onProductClick={(product) => router.push(`/product/${product.id}`)}
          wishlist={wishlist}
        />
      )}
    </motion.div>
  );
}
