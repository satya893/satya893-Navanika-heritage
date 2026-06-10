import React from 'react';
import Image from 'next/image';
import { X, Heart, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface WishlistProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  wishlist: any[];
}

export default function Wishlist({ isOpen, onClose, user, wishlist }: WishlistProps) {
  const removeItem = async (itemId: string) => {
    if (!user) return;
    const wishlistRef = doc(db, 'users', user.uid, 'wishlist', itemId);
    await deleteDoc(wishlistRef);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex justify-end"
      onClick={onClose}
    >
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="h-full w-full md:w-[500px] bg-white dark:bg-brand-blue shadow-2xl flex flex-col border-l border-brand-blue/5 dark:border-white/10"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-10 flex justify-between items-center border-b border-brand-blue/5 dark:border-white/10 bg-brand-beige/20 dark:bg-white/5">
            <div>
              <h2 className="text-2xl font-serif text-brand-blue dark:text-brand-beige">Personal Curation</h2>
              <p className="text-[9px] text-brand-gold uppercase tracking-[0.4em] font-black mt-1">Wishlist ({wishlist.length})</p>
            </div>
            <button aria-label="Close wishlist" onClick={onClose} className="p-2 hover:bg-brand-blue/5 dark:hover:bg-white/5 rounded-full transition-colors text-brand-blue/40 dark:text-brand-beige/40 hover:text-brand-blue dark:hover:text-brand-beige">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <Heart size={48} className="text-brand-blue/10 dark:text-brand-beige/10" />
                <p className="text-brand-blue/40 dark:text-brand-beige/40 font-serif italic text-xl">Your wishlist is empty.</p>
              </div>
            ) : (
              wishlist.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="relative w-24 h-32 shrink-0 shadow-lg overflow-hidden border border-brand-blue/5 dark:border-white/10 rounded-sm bg-brand-blue/5 dark:bg-white/5">
                    <Image 
                      src={item.image} 
                      fill
                      sizes="96px"
                      className="object-cover" 
                      alt={item.name} 
                    />
                  </div>
                  <div className="flex-1 py-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif text-lg text-brand-blue dark:text-brand-beige">{item.name}</h4>
                        <p className="text-[9px] text-brand-blue/40 dark:text-brand-beige/40 mt-1 uppercase tracking-widest font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      <button aria-label={`Remove ${item.name} from wishlist`} onClick={() => removeItem(item.id)} className="text-brand-blue/20 dark:text-brand-beige/20 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <button aria-label={`Move ${item.name} to cart`} className="w-full mt-4 bg-brand-blue/5 dark:bg-white/5 text-brand-blue/80 dark:text-brand-beige/80 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-brand-gold hover:text-white transition-all">
                      Move to Cart
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
    </motion.div>
  );
}
