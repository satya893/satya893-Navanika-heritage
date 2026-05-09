"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { LogOut, Package, ChevronRight, ShoppingBag, Clock } from 'lucide-react';
import { getUserOrders, Order } from '../../lib/orders';
import { logout } from '../../firebase';
import { useApp } from '../../context/AppContext';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-green-500 bg-green-500/10 border-green-500/30',
  pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  shipped: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  delivered: 'text-brand-gold bg-brand-gold/10 border-brand-gold/30',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, userData, setIsAuthOpen } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      setIsAuthOpen(true);
      router.push('/');
      return;
    }
    getUserOrders(user.uid).then(o => { setOrders(o); setLoading(false); });
  }, [user, router, setIsAuthOpen]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-beige dark:bg-brand-blue pt-36 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-16"
        >
          <div className="flex items-center gap-6">
            {(userData?.photoURL || user?.photoURL) ? (
              <div className="relative w-20 h-20 rounded-full border-2 border-brand-gold shadow-lg overflow-hidden">
                <Image
                  src={userData?.photoURL || user.photoURL}
                  alt={userData?.displayName || user.displayName || ''}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative w-20 h-20 rounded-full border-2 border-brand-gold shadow-lg overflow-hidden">
                <Image
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData?.displayName || user.displayName || user.email || 'U')}`}
                  alt={userData?.displayName || user.displayName || 'User'}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-serif text-brand-blue dark:text-brand-beige">
                {user.displayName || 'Member'}
              </h1>
              <p className="text-brand-blue/40 dark:text-brand-beige/40 text-sm mt-1">{user.email}</p>
              <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-[0.4em] text-brand-gold border border-brand-gold/30 px-3 py-1">
                {userData?.role === 'admin' ? 'ADMIN' : 'HERITAGE MEMBER'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-black text-brand-blue/40 dark:text-brand-beige/40 hover:text-red-500 transition-colors border border-brand-blue/10 dark:border-white/10 hover:border-red-500/30 px-4 py-3 rounded-sm"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </motion.div>

        {/* Orders */}
        <div className="mb-6 flex items-center gap-3">
          <Package size={16} className="text-brand-gold" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-blue/50 dark:text-brand-beige/50">
            Your Orders
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 flex flex-col items-center gap-6"
          >
            <ShoppingBag size={48} className="text-brand-blue/10 dark:text-brand-beige/10" />
            <p className="font-serif italic text-xl text-brand-blue/40 dark:text-brand-beige/40">
              Your order history will appear here.
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-[10px] uppercase tracking-[0.3em] font-black bg-brand-gold text-white px-8 py-4 hover:bg-brand-blue transition-all rounded-sm"
            >
              Explore Collection
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const total = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
              const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-6 hover:border-brand-gold/30 transition-all cursor-pointer group"
                  onClick={() => router.push(`/order/${order.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-mono text-brand-blue dark:text-brand-beige text-sm font-bold">
                        #{order.id?.slice(0, 12).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-brand-blue/30 dark:text-brand-beige/30" />
                        <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] font-bold">
                          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] font-black uppercase tracking-widest border px-3 py-1.5 rounded-sm capitalize ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status}
                      </span>
                      <ChevronRight size={16} className="text-brand-blue/20 dark:text-brand-beige/20 group-hover:text-brand-gold transition-colors" />
                    </div>
                  </div>

                  {/* Item thumbnails */}
                  <div className="flex gap-2 mb-4">
                    {order.items.slice(0, 4).map((item, j) => (
                      <div key={j} className="relative w-14 h-20 rounded-sm border border-brand-blue/5 dark:border-white/10 overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-14 h-20 rounded-sm border border-brand-blue/5 dark:border-white/10 bg-brand-blue/5 dark:bg-white/5 flex items-center justify-center">
                        <span className="text-[10px] font-black text-brand-blue/40 dark:text-brand-beige/40">+{order.items.length - 4}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] uppercase tracking-widest font-bold">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                    <p className="font-serif text-xl text-brand-blue dark:text-brand-beige">₹{total.toLocaleString('en-IN')}</p>
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
