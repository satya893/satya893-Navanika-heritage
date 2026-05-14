"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { 
  Package, ShoppingBag, Clock, ChevronRight, ArrowLeft 
} from 'lucide-react';
import { getUserOrders, Order } from '../../lib/orders';
import { useApp } from '../../context/AppContext';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-green-500 bg-green-500/10 border-green-500/30',
  pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  shipped: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  delivered: 'text-brand-gold bg-brand-gold/10 border-brand-gold/30',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, setIsAuthOpen } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      setIsAuthOpen(true);
      router.push('/');
      return;
    }
    getUserOrders(user.uid).then(o => { 
      setOrders(o); 
      setLoading(false); 
    });
  }, [user, router, setIsAuthOpen]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-beige dark:bg-brand-blue pt-32 pb-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - Enhanced */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 flex items-center justify-center rounded-sm bg-white dark:bg-white/5 border border-brand-gold/10 text-brand-blue/40 dark:text-brand-beige/40 hover:text-brand-gold hover:border-brand-gold transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-brand-blue dark:text-brand-beige">The Archives</h1>
              <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] md:text-[10px] mt-1 uppercase tracking-[0.4em] font-black">Your Heritage Acquisition History</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-brand-gold/5 border border-brand-gold/10 rounded-sm">
            <Package size={16} className="text-brand-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold">{orders.length} Masterpieces</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-brand-gold/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold animate-pulse">Unrolling the silk archives...</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 flex flex-col items-center gap-10 bg-white dark:bg-white/5 border border-brand-gold/10 rounded-sm shadow-xl"
          >
            <div className="w-24 h-24 bg-brand-gold/5 rounded-sm flex items-center justify-center text-brand-gold/30">
              <ShoppingBag size={48} />
            </div>
            <div className="space-y-6">
              <p className="font-serif italic text-3xl text-brand-blue/60 dark:text-brand-beige/60">
                Your archive is currently empty.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="group relative px-10 py-5 bg-brand-gold text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-sm overflow-hidden transition-all hover:shadow-[0_10px_30px_rgba(184,142,47,0.3)]"
              >
                <span className="relative z-10 flex items-center gap-4">
                  Begin Your Collection <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-brand-blue translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {orders.map((order, i) => {
              const total = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
              const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-white dark:bg-white/5 border border-brand-gold/10 rounded-sm overflow-hidden hover:border-brand-gold/50 transition-all duration-500 shadow-sm hover:shadow-2xl"
                  onClick={() => router.push(`/order/${order.id}`)}
                >
                  <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-brand-gold/10 text-brand-gold px-4 py-1.5 rounded-sm border border-brand-gold/20">
                            Heritage Order
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest border px-4 py-1.5 rounded-sm shadow-sm ${STATUS_COLORS[order.status] || ''}`}>
                            {order.status}
                          </span>
                        </div>
                        <h3 className="font-mono text-xl md:text-2xl text-brand-blue dark:text-brand-beige font-bold tracking-tight">
                          #{order.id?.slice(0, 12).toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-3">
                          <Clock size={14} className="text-brand-gold/60" />
                          <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                            Authenticated on {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[10px] uppercase tracking-[0.4em] font-black mb-2">Total Investment</p>
                        <p className="font-serif text-4xl text-brand-gold">₹{total.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-10">
                      {order.items.map((item, j) => (
                        <div key={j} className="relative w-20 h-28 rounded-sm border border-brand-gold/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-md">
                          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-brand-gold/10 flex items-center justify-between">
                      <p className="text-brand-blue/60 dark:text-brand-beige/60 text-[11px] uppercase tracking-[0.2em] font-black">
                        {order.items.length} {order.items.length > 1 ? 'Masterpieces' : 'Masterpiece'} in Archive
                      </p>
                      <div className="flex items-center gap-3 text-brand-gold font-black uppercase tracking-[0.3em] text-[10px]">
                        <span>View Archive Certificate</span>
                        <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
