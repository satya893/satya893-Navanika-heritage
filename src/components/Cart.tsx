import React from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  cart: any[];
  onCheckout: () => void;
}

export default function Cart({ isOpen, onClose, user, cart, onCheckout }: CartProps) {
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const updateQuantity = async (itemId: string, delta: number) => {
    if (!user) return;
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    const cartRef = doc(db, 'users', user.uid, 'cart', itemId);
    await setDoc(cartRef, { ...item, quantity: newQty }, { merge: true });
  };

  const removeItem = async (itemId: string) => {
    if (!user) return;
    const cartRef = doc(db, 'users', user.uid, 'cart', itemId);
    await deleteDoc(cartRef);
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
              <h2 className="text-2xl font-serif text-brand-blue dark:text-brand-beige">Atelier Selection</h2>
              <p className="text-[9px] text-brand-gold uppercase tracking-[0.4em] font-black mt-1">Curation ({cart.length})</p>
            </div>
            <button aria-label="Close cart" onClick={onClose} className="p-2 hover:bg-brand-blue/5 dark:hover:bg-white/5 rounded-full transition-colors text-brand-blue/40 dark:text-brand-beige/40 hover:text-brand-blue dark:hover:text-brand-beige">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <ShoppingBag size={48} className="text-brand-blue/10 dark:text-brand-beige/10" />
                <p className="text-brand-blue/40 dark:text-brand-beige/40 font-serif italic text-xl">The bag awaits its treasures.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="relative w-24 h-32 shrink-0 shadow-lg overflow-hidden border border-brand-blue/5 dark:border-white/10 rounded-sm bg-brand-blue/5 dark:bg-white/5">
                    <Image 
                      src={item.image} 
                      fill
                      sizes="96px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={item.name} 
                    />
                  </div>
                  <div className="flex-1 py-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif text-lg text-brand-blue dark:text-brand-beige">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[9px] text-brand-blue/40 dark:text-brand-beige/40 uppercase tracking-widest font-bold">${item.price.toFixed(2)}</p>
                          {item.size && (
                            <span className="text-[9px] text-brand-gold border border-brand-gold/30 px-2 py-0.5 font-black">SIZE: {item.size}</span>
                          )}
                        </div>
                      </div>
                      <button aria-label={`Remove ${item.name} from cart`} onClick={() => removeItem(item.id)} className="text-brand-blue/20 dark:text-brand-beige/20 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 rounded-full p-1">
                        <button aria-label={`Decrease quantity of ${item.name}`} onClick={() => updateQuantity(item.id, -1)} className="p-1 text-brand-blue/40 dark:text-brand-beige/40 hover:text-brand-blue dark:hover:text-brand-beige"><Minus size={12} /></button>
                        <span className="w-8 text-center text-xs font-bold text-brand-blue dark:text-brand-beige">{item.quantity}</span>
                        <button aria-label={`Increase quantity of ${item.name}`} onClick={() => updateQuantity(item.id, 1)} className="p-1 text-brand-blue/40 dark:text-brand-beige/40 hover:text-brand-blue dark:hover:text-brand-beige"><Plus size={12} /></button>
                      </div>
                      <p className="font-serif text-lg text-brand-blue dark:text-brand-beige">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-10 bg-brand-beige/10 dark:bg-black border-t border-brand-blue/5 dark:border-white/10">
              <div className="flex justify-between text-2xl font-serif text-brand-blue dark:text-brand-beige mb-8">
                <span>Total Investment</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button onClick={onCheckout} className="w-full bg-brand-gold text-white font-bold py-6 text-[10px] uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:bg-brand-beige dark:hover:text-brand-blue transition-all shadow-xl">
                Secure Checkout
              </button>
            </div>
          )}
        </motion.div>
    </motion.div>
  );
}
