"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, Package, Tag, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { UserNotification, markAsRead, markAllAsRead } from '../lib/notifications';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { user } = useApp();
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserNotification[];
        
        setNotifications(docs);
        setUnreadCount(docs.filter(n => !n.isRead).length);
      },
      (error) => {
        console.error("User Notifications permission error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (n: UserNotification) => {
    if (user && n.id) {
      await markAsRead(user.uid, n.id);
    }
    if (n.link) {
      const targetLink = n.link === '/shop' ? '/' : n.link;
      router.push(targetLink);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package size={14} className="text-blue-500" />;
      case 'offer': return <Tag size={14} className="text-green-500" />;
      case 'product': return <Sparkles size={14} className="text-brand-gold" />;
      default: return <Bell size={14} className="text-brand-gold" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-brand-blue dark:text-brand-beige hover:bg-brand-gold/10 rounded-full transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-gold text-white text-[8px] font-black flex items-center justify-center rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-brand-beige dark:bg-brand-blue border border-brand-gold/20 shadow-2xl rounded-sm z-[120] overflow-hidden"
            >
              <div className="p-4 border-b border-brand-gold/10 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-blue dark:text-brand-beige">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead(user.uid)}
                    className="text-[9px] font-bold text-brand-gold uppercase tracking-tighter hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <Bell size={24} className="mx-auto text-brand-blue/10 dark:text-brand-beige/10 mb-4" />
                    <p className="text-xs text-brand-blue/40 dark:text-brand-beige/40 italic">No updates yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-4 border-b border-brand-gold/5 hover:bg-brand-gold/5 transition-all flex gap-3 ${!n.isRead ? 'bg-brand-gold/[0.03]' : ''}`}
                    >
                      <div className="mt-1 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs ${!n.isRead ? 'font-bold text-brand-blue dark:text-brand-beige' : 'text-brand-blue/60 dark:text-brand-beige/60'}`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-brand-blue/40 dark:text-brand-beige/40 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[8px] text-brand-gold font-bold uppercase mt-2">
                          {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                      {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 shrink-0" />}
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-brand-gold/5 text-center">
                  <p className="text-[8px] uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40">Showing latest 20 updates</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
