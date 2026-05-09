"use client";

import React, { useState, useEffect } from 'react';
import { Bell, ShoppingBag, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { UserNotification, markAdminAsRead } from '../lib/notifications';

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'admin_notifications'),
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
        console.error("Admin Notifications permission error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = async (n: UserNotification) => {
    if (n.id) {
      await markAdminAsRead(n.id);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string, title: string) => {
    if (title.toLowerCase().includes('order')) return <ShoppingBag size={14} className="text-blue-500" />;
    if (title.toLowerCase().includes('stock')) return <AlertTriangle size={14} className="text-red-500" />;
    if (title.toLowerCase().includes('cancel') || title.toLowerCase().includes('return')) return <X size={14} className="text-orange-500" />;
    return <Bell size={14} className="text-brand-gold" />;
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-brand-blue dark:text-brand-beige hover:bg-brand-gold/10 rounded-full transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full">
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
              <div className="p-4 border-b border-brand-gold/10 flex justify-between items-center bg-brand-gold/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-blue dark:text-brand-beige">Admin Alerts</h3>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <Bell size={24} className="mx-auto text-brand-blue/10 dark:text-brand-beige/10 mb-4" />
                    <p className="text-xs text-brand-blue/40 dark:text-brand-beige/40 italic">All clear.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-4 border-b border-brand-gold/5 hover:bg-brand-gold/5 transition-all flex gap-3 ${!n.isRead ? 'bg-red-500/[0.02]' : ''}`}
                    >
                      <div className="mt-1 shrink-0">
                        {getIcon(n.type, n.title)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs ${!n.isRead ? 'font-bold text-brand-blue dark:text-brand-beige' : 'text-brand-blue/60 dark:text-brand-beige/60'}`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-brand-blue/40 dark:text-brand-beige/40 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[8px] text-brand-gold font-bold uppercase mt-2">
                          {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
