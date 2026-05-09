import React from 'react';
import { Metadata } from 'next';
import { fetchProductById } from '../../../data/products';
import ProductClient from './ProductClient';

interface Props {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchProductById(resolvedParams.productId);
  
  if (!product) {
    return {
      title: 'Product Not Found - Navanika Heritage',
    };
  }

  return {
    title: `${product.name} | Navanika Heritage`,
    description: product.description || `Buy ${product.name} at Navanika Heritage.`,
    openGraph: {
      title: `${product.name} - Navanika Heritage`,
      description: product.description || `Buy ${product.name} at Navanika Heritage.`,
      images: [
        {
          url: product.image,
          width: 800,
          height: 1200,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - Navanika Heritage`,
      description: product.description || `Buy ${product.name} at Navanika Heritage.`,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await fetchProductById(resolvedParams.productId);

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-beige dark:bg-brand-blue">
        <p className="text-brand-gold text-2xl font-serif">Masterpiece not found.</p>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'Navanika Heritage',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: (product as any).stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://navanika.com'}/product/${product.id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient product={product} />
    </>
  );
}

