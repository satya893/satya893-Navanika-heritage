"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '../../../data/products';
import ProductDetails from '../../../components/ProductDetails';
import Reviews from '../../../components/Reviews';
import { motion } from 'motion/react';
import { useApp } from '../../../context/AppContext';

interface ProductClientProps {
  product: Product;
}

export default function ProductClient({ product }: ProductClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, setSelectedProductForStudio, setIsModelingStudioOpen, wishlist } = useApp();

  const isWishlisted = wishlist.some(item => item.id === product.id || item.productId === product.id);

  const handleOpenModelingStudio = (p: any) => {
    setSelectedProductForStudio(p);
    setIsModelingStudioOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32"
    >
      <ProductDetails 
        product={product} 
        onBack={() => router.back()} 
        onAddToCart={addToCart} 
        onToggleWishlist={toggleWishlist}
        onOpenModelingStudio={handleOpenModelingStudio}
        isWishlisted={isWishlisted}
      />
      
      <Reviews productId={product.id} />
    </motion.div>
  );
}
