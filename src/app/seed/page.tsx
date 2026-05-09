"use client";

import React, { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ALL_PRODUCTS } from '../../data/products';

export default function SeedPage() {
  const [status, setStatus] = useState("Ready to seed");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus("Seeding...");
    try {
      const batch = writeBatch(db);
      const productsRef = collection(db, 'products');

      let count = 0;
      for (const product of ALL_PRODUCTS) {
        const docRef = doc(productsRef, product.id);
        batch.set(docRef, product);
        count++;
      }

      await batch.commit();
      setStatus(`Successfully seeded ${count} products to Firestore!`);
    } catch (error: any) {
      console.error("Seeding error:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-blue flex flex-col items-center justify-center text-brand-beige">
      <h1 className="text-4xl font-serif mb-6">Database Migration</h1>
      <button 
        onClick={handleSeed} 
        disabled={loading}
        className="bg-brand-gold text-white px-8 py-4 uppercase tracking-widest text-[10px] font-black rounded-sm disabled:opacity-50"
      >
        {loading ? "Seeding..." : "Start Seeding"}
      </button>
      <p className="mt-6 text-sm opacity-60 font-mono text-center max-w-lg">{status}</p>
    </div>
  );
}
