"use client";

import React from 'react';
import Navbar from './Navbar';
import ChatAdvisor from './ChatAdvisor';
import ImageGenerator from './ImageGenerator';
import Cart from './Cart';
import Wishlist from './Wishlist';
import AuthModal from './AuthModal';
import ModelingStudio from './ModelingStudio';
import { Sparkles, MessageSquare } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { logout } from '../firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const {
    user, cart, wishlist,
    isAuthOpen, setIsAuthOpen,
    isCartOpen, setIsCartOpen,
    isWishlistOpen, setIsWishlistOpen,
    isChatOpen, setIsChatOpen,
    isGenOpen, setIsGenOpen,
    isModelingStudioOpen, setIsModelingStudioOpen,
    selectedProductForStudio,
    isDarkMode, toggleDarkMode,
    userData
  } = useApp();

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
  const isAdmin = userData?.role === 'admin' || (user?.email ? adminEmails.includes(user.email.toLowerCase()) : false);
  const router = useRouter();

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-brand-beige text-brand-blue dark:bg-brand-blue dark:text-brand-beige font-sans selection:bg-brand-gold selection:text-white transition-colors duration-300">
      <Navbar 
        user={user} 
        onLogin={() => setIsAuthOpen(true)}
        onLogout={logout} 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isAdmin={isAdmin}
      />

      <main>{children}</main>

      {/* Floating Actions */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
        <button 
          onClick={() => setIsGenOpen(true)}
          className="w-14 h-14 bg-brand-gold text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          title="Virtual Atelier"
        >
          <Sparkles size={24} />
        </button>
        <button 
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 bg-brand-blue dark:bg-brand-beige text-brand-beige dark:text-brand-blue rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          title="Style Advisor"
        >
          <MessageSquare size={24} />
        </button>
      </div>

      <AnimatePresence>
        {isCartOpen && <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} user={user} cart={cart} onCheckout={handleCheckout} />}
        {isWishlistOpen && <Wishlist isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} user={user} wishlist={wishlist} />}
        {isChatOpen && <ChatAdvisor isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
        {isGenOpen && <ImageGenerator isOpen={isGenOpen} onClose={() => setIsGenOpen(false)} />}
        {isModelingStudioOpen && (
          <ModelingStudio 
            isOpen={isModelingStudioOpen} 
            onClose={() => setIsModelingStudioOpen(false)} 
            product={selectedProductForStudio}
          />
        )}
        {isAuthOpen && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
      </AnimatePresence>

      <footer className="bg-brand-beige/30 dark:bg-brand-beige/20 border-t border-brand-blue/5 py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-brand-gold shadow-lg bg-white shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="Navanika Logo" 
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </div>
              <h3 className="text-4xl font-serif tracking-tighter text-brand-blue dark:text-brand-beige">NAVANIKA</h3>
            </div>
            <p className="text-brand-blue/60 dark:text-brand-beige/60 max-w-sm font-light leading-relaxed italic">
              "Navanika represents the soul of Indian craftsmanship. Every thread is a silent tribute to the weavers of our history."
            </p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.5em] font-black mb-8 text-brand-gold">Boutique</h4>
            <ul className="space-y-4 text-brand-blue/60 dark:text-brand-beige/60 text-[10px] tracking-[0.2em] uppercase font-bold">
              <li>Heritage Sarees</li>
              <li>Bridal Atelier</li>
              <li>Custom Bespoke</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.5em] font-black mb-8 text-brand-gold">Connect</h4>
            <ul className="space-y-4 text-brand-blue/60 dark:text-brand-beige/60 text-[10px] tracking-[0.2em] uppercase font-bold">
              <li>Instagram</li>
              <li>Pinterest</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
