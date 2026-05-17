"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { 
  LogOut, Package, ChevronRight, ShoppingBag, Clock, 
  MapPin, Phone, User, CreditCard, Bell, ShieldCheck, 
  Globe, Smartphone, Sparkles, Settings
} from 'lucide-react';
import { getUserOrders, Order } from '../../lib/orders';
import { logout } from '../../firebase';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-green-500 bg-green-500/10 border-green-500/30',
  pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  shipped: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  delivered: 'text-brand-gold bg-brand-gold/10 border-brand-gold/30',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-beige dark:bg-brand-blue flex items-center justify-center"><div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <ProfilePageInner />
    </Suspense>
  );
}

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { user, userData, wishlist, setIsAuthOpen } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrders, setShowOrders] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showManageDevices, setShowManageDevices] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  
  const [newDisplayName, setNewDisplayName] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userData?.displayName) setNewDisplayName(userData.displayName);
  }, [userData]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      setIsAuthOpen(true);
      router.push('/');
      return;
    }
    getUserOrders(user.uid).then(o => { setOrders(o); setLoading(false); });
  }, [user, router, setIsAuthOpen]);

  useEffect(() => {
    if (tab === 'orders') {
      setShowOrders(true);
      setTimeout(() => {
        const el = document.getElementById('orders-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [tab]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      await updateDoc(doc(db, 'users', user.uid), { displayName: newDisplayName });
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsUpdating(false);
      setShowEditProfile(false);
    }
  };

  const handleRedeemGiftCard = async () => {
    if (!user || !giftCardCode) return;
    setIsUpdating(true);
    try {
      const { doc, getDoc, updateDoc, increment } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      
      const gcRef = doc(db, 'giftCards', giftCardCode.toUpperCase());
      const gcSnap = await getDoc(gcRef);
      
      if (gcSnap.exists() && !gcSnap.data().isUsed) {
        const amount = gcSnap.data().amount;
        await updateDoc(gcRef, { isUsed: true, usedBy: user.uid, usedAt: new Date().toISOString() });
        await updateDoc(doc(db, 'users', user.uid), { walletBalance: increment(amount) });
        toast.success(`Successfully redeemed ₹${amount}!`);
        setGiftCardCode('');
      } else {
        toast.error("Invalid or already used gift card code.");
      }
    } catch (err) {
      console.error("Redemption failed", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoutDevice = async (sessionId: string) => {
    if (!user) return;
    try {
      const { doc, updateDoc, arrayRemove } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      const sessionToRemove = userData?.sessions?.find((s: any) => s.id === sessionId);
      if (sessionToRemove) {
        await updateDoc(doc(db, 'users', user.uid), { sessions: arrayRemove(sessionToRemove) });
      }
    } catch (err) {
      console.error("Device logout failed", err);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-beige dark:bg-brand-blue pt-32 pb-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header - Enhanced Heritage Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-sm bg-white dark:bg-white/5 border border-brand-gold/10 dark:border-white/10 p-8 md:p-12 mb-12 shadow-2xl"
        >
          {/* Subtle Mandala Background */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.05] pointer-events-none -translate-y-1/2 translate-x-1/2">
            <div className="absolute inset-0 bg-[url('/mandala.png')] bg-contain bg-no-repeat animate-slow-spin" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar with Gold Frame */}
            <div className="relative group">
              {(userData?.photoURL || user?.photoURL) ? (
                <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-brand-gold via-brand-beige to-brand-gold shadow-[0_0_25px_rgba(184,142,47,0.2)]">
                  <div className="relative w-full h-full rounded-full border-2 border-white dark:border-brand-blue overflow-hidden">
                    <Image
                      src={userData?.photoURL || user.photoURL}
                      alt={userData?.displayName || user.displayName || ''}
                      fill
                      sizes="128px"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-brand-gold via-brand-beige to-brand-gold shadow-[0_0_25px_rgba(184,142,47,0.2)]">
                  <div className="relative w-full h-full rounded-full border-2 border-white dark:border-brand-blue overflow-hidden">
                    <Image
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData?.displayName || user.displayName || user.email || 'U')}`}
                      alt={userData?.displayName || user.displayName || 'User'}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-gold text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-brand-blue">
                <ShieldCheck size={18} />
              </div>
            </div>

            {/* Info and Actions */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-serif text-brand-blue dark:text-brand-beige leading-tight">
                  {user.displayName || 'Heritage Member'}
                </h1>
                <p className="text-brand-blue/40 dark:text-brand-beige/40 text-sm mt-2 font-bold uppercase tracking-[0.2em]">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.3em] text-brand-gold border border-brand-gold/30 px-4 py-2 rounded-sm bg-brand-gold/5">
                    {userData?.role === 'admin' ? 'Archive Admin' : 'Heritage Member'}
                  </span>
                  {userData?.role === 'admin' && (
                    <button 
                      onClick={() => router.push('/admin')}
                      className="text-[9px] font-black uppercase tracking-[0.3em] bg-brand-gold text-white px-6 py-2 rounded-sm hover:bg-brand-blue transition-all shadow-[0_5px_15px_rgba(184,142,47,0.3)]"
                    >
                      Go to Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sign Out on Top Right */}
            <div className="md:absolute md:top-8 md:right-8">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-red-500/60 hover:text-red-600 transition-colors border border-red-500/10 hover:border-red-500/30 px-6 py-3 rounded-sm bg-red-500/5 backdrop-blur-md"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </motion.div>

        {/* Account Settings Section */}
        <div className="mb-20">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-white shadow-lg">
                <Settings size={20} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.5em] text-brand-blue dark:text-brand-beige">
                Account Settings
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {[
              { id: 'plus', label: 'Navanika Heritage Gold', icon: Sparkles, color: 'text-brand-gold' },
              { id: 'devices', label: 'Manage Devices', icon: Smartphone, toggle: true, target: 'devices' },
              { id: 'edit', label: 'Edit Profile', icon: User, toggle: true, target: 'edit' },
              { id: 'payments', label: 'Wallet & Gift Cards', icon: CreditCard, toggle: true, target: 'wallet' },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin, toggle: true, target: 'addresses' },
              { id: 'language', label: 'Select Language', icon: Globe },
              { id: 'notifications', label: 'Notification Settings', icon: Bell },
              { id: 'collection', label: 'My Collection', icon: ShoppingBag, toggle: true, target: 'collection' },
            ].map((item, i) => (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => {
                    if (item.target === 'addresses') setShowAddresses(!showAddresses);
                    if (item.target === 'edit') setShowEditProfile(!showEditProfile);
                    if (item.target === 'devices') setShowManageDevices(!showManageDevices);
                    if (item.target === 'wallet') setShowWallet(!showWallet);
                    if (item.target === 'collection') setShowCollection(!showCollection);
                  }}
                  className="w-full flex items-center justify-between p-6 bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm hover:border-brand-gold/50 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center bg-brand-blue/5 dark:bg-white/5 group-hover:bg-brand-gold/10 transition-colors`}>
                      <item.icon size={20} className={`${item.color || 'text-brand-blue/40 dark:text-brand-beige/40'} group-hover:text-brand-gold transition-colors`} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue/80 dark:text-brand-beige/80 group-hover:text-brand-blue dark:group-hover:text-brand-beige transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={18} className={`text-brand-blue/20 dark:text-brand-beige/20 group-hover:text-brand-gold transition-all ${item.toggle && (
                    (item.target === 'addresses' && showAddresses) ||
                    (item.target === 'edit' && showEditProfile) ||
                    (item.target === 'devices' && showManageDevices) ||
                    (item.target === 'wallet' && showWallet) ||
                    (item.target === 'collection' && showCollection)
                  ) ? 'rotate-90' : ''}`} />
                </button>
                
                {/* Edit Profile Sub-menu */}
                {item.id === 'edit' && (
                  <motion.div initial={false} animate={{ height: showEditProfile ? 'auto' : 0, opacity: showEditProfile ? 1 : 0 }} className="overflow-hidden bg-brand-blue/5 dark:bg-black/20 rounded-sm mt-[-12px] mb-4">
                    <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40 block mb-2">Display Name</label>
                        <input 
                          type="text" 
                          value={newDisplayName} 
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          className="w-full bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-4 py-3 text-xs text-brand-blue dark:text-brand-beige rounded-sm focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isUpdating}
                        className="w-full bg-brand-gold text-white py-3 text-[9px] font-black uppercase tracking-widest hover:bg-brand-blue transition-colors rounded-sm"
                      >
                        {isUpdating ? 'Updating...' : 'Save Changes'}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Manage Devices Sub-menu */}
                {item.id === 'devices' && (
                  <motion.div initial={false} animate={{ height: showManageDevices ? 'auto' : 0, opacity: showManageDevices ? 1 : 0 }} className="overflow-hidden bg-brand-blue/5 dark:bg-black/20 rounded-sm mt-[-12px] mb-4">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-sm border border-brand-gold/20">
                        <div className="flex items-center gap-3">
                          <Smartphone size={16} className="text-brand-gold" />
                          <div>
                            <p className="text-[10px] font-bold text-brand-blue dark:text-brand-beige uppercase tracking-widest">Current Device</p>
                            <p className="text-[9px] text-brand-blue/40 dark:text-brand-beige/40 uppercase mt-0.5">Your active session</p>
                          </div>
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-widest bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full border border-brand-gold/20">Active Now</span>
                      </div>
                      
                      {userData?.sessions?.map((session: any) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-sm border border-brand-blue/10 dark:border-white/10">
                          <div className="flex items-center gap-3 text-brand-blue/40 dark:text-brand-beige/40">
                            <Smartphone size={16} />
                            <div>
                              <p className="text-[10px] font-bold text-brand-blue dark:text-brand-beige uppercase tracking-widest">{session.deviceName}</p>
                              <p className="text-[9px] uppercase mt-0.5">Last active: {new Date(session.lastActive).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleLogoutDevice(session.id)}
                            className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-sm border border-red-500/20 transition-colors"
                          >
                            Logout
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Wallet & Gift Cards Sub-menu */}
                {item.id === 'payments' && (
                  <motion.div initial={false} animate={{ height: showWallet ? 'auto' : 0, opacity: showWallet ? 1 : 0 }} className="overflow-hidden bg-brand-blue/5 dark:bg-black/20 rounded-sm mt-[-12px] mb-4">
                    <div className="p-6 space-y-6">
                      <div className="text-center p-6 bg-white dark:bg-white/5 rounded-sm border border-brand-blue/10 dark:border-white/10">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-blue/40 dark:text-brand-beige/40 mb-2">Navanika Wallet Balance</p>
                        <p className="text-3xl font-serif text-brand-gold">₹{(userData?.walletBalance || 0).toLocaleString('en-IN')}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40">Redeem Gift Card</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="GIFT-XXXX-XXXX"
                            value={giftCardCode}
                            onChange={(e) => setGiftCardCode(e.target.value)}
                            className="flex-1 bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-4 py-3 text-xs text-brand-blue dark:text-brand-beige rounded-sm focus:outline-none focus:border-brand-gold uppercase placeholder:normal-case"
                          />
                          <button 
                            onClick={handleRedeemGiftCard}
                            disabled={isUpdating || !giftCardCode}
                            className="bg-brand-gold text-white px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-brand-blue transition-colors rounded-sm disabled:opacity-50"
                          >
                            Redeem
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {item.id === 'addresses' && (
                  <motion.div
                    initial={false}
                    animate={{ height: showAddresses ? 'auto' : 0, opacity: showAddresses ? 1 : 0 }}
                    className="overflow-hidden bg-brand-blue/5 dark:bg-black/20 rounded-sm mt-[-12px] mb-4"
                  >
                    <div className="p-6">
                      {userData?.addresses && userData.addresses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {userData.addresses.map((addr: any) => (
                            <div key={addr.id} className="bg-white dark:bg-[#0a1128] border border-brand-blue/5 dark:border-white/10 rounded-sm p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[7px] font-black uppercase tracking-widest bg-brand-gold text-white px-2 py-0.5 rounded-full">{addr.label}</span>
                              </div>
                              <p className="text-xs font-bold text-brand-blue dark:text-brand-beige">{addr.fullName}</p>
                              <p className="text-[10px] text-brand-blue/60 dark:text-brand-beige/60 mt-1">
                                {addr.address}, {addr.city}, {addr.pincode}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-[10px] text-brand-blue/40 dark:text-brand-beige/40 py-4 uppercase tracking-widest">No addresses saved yet.</p>
                      )}
                    </div>
                  </motion.div>
                )}
                {/* My Collection (Wishlist) Sub-menu */}
                {item.id === 'collection' && (
                  <motion.div initial={false} animate={{ height: showCollection ? 'auto' : 0, opacity: showCollection ? 1 : 0 }} className="overflow-hidden bg-brand-blue/5 dark:bg-black/20 rounded-sm mt-[-12px] mb-4">
                    <div className="p-6">
                      {wishlist.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {wishlist.map((product: any) => (
                            <div 
                              key={product.productId} 
                              onClick={() => router.push(`/product/${product.productId}`)}
                              className="bg-white dark:bg-[#0a1128] border border-brand-blue/5 dark:border-white/10 rounded-sm overflow-hidden group/item cursor-pointer"
                            >
                              <div className="relative aspect-[3/4] overflow-hidden">
                                <Image 
                                  src={product.image} 
                                  alt={product.name} 
                                  fill 
                                  sizes="150px"
                                  className="object-cover group-hover/item:scale-110 transition-transform duration-500" 
                                />
                              </div>
                              <div className="p-3">
                                <p className="text-[9px] font-bold text-brand-blue dark:text-brand-beige truncate uppercase tracking-widest">{product.name}</p>
                                <p className="text-[10px] text-brand-gold mt-1 font-serif">₹{product.price.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 flex flex-col items-center gap-4">
                          <ShoppingBag size={32} className="text-brand-blue/10 dark:text-brand-beige/10" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40">Your collection is empty</p>
                          <button 
                            onClick={() => router.push('/')}
                            className="text-[8px] font-black uppercase tracking-widest text-brand-gold border border-brand-gold/30 px-4 py-2 hover:bg-brand-gold hover:text-white transition-all rounded-sm"
                          >
                            Explore Heritage
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                {i < 7 && <div className="h-2" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Orders Section */}
        <button 
          id="orders-section"
          onClick={() => setShowOrders(!showOrders)}
          className="w-full flex items-center justify-between p-6 border border-brand-blue/10 dark:border-white/10 rounded-sm bg-white dark:bg-white/5 hover:border-brand-gold/50 transition-all group shadow-sm scroll-mt-32"
        >
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-sm flex items-center justify-center bg-brand-gold/10 text-brand-gold transition-colors`}>
              <Package size={24} />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black uppercase tracking-[0.5em] text-brand-blue dark:text-brand-beige">
                Your Orders
              </h2>
              <p className="text-[9px] uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40 mt-1 font-bold">Manage heritage acquisitions</p>
            </div>
          </div>
          <ChevronRight size={24} className={`transition-transform duration-300 ${showOrders ? 'rotate-90 text-brand-gold' : 'text-brand-blue/20 dark:text-brand-beige/20'}`} />
        </button>

        <motion.div
          initial={false}
          animate={{ height: showOrders ? 'auto' : 0, opacity: showOrders ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="py-8">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center gap-6">
                <ShoppingBag size={40} className="text-brand-blue/10 dark:text-brand-beige/10" />
                <p className="font-serif italic text-lg text-brand-blue/40 dark:text-brand-beige/40">
                  Your order history will appear here.
                </p>
              </div>
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
                        </div>
                      </div>

                      <div className="flex gap-2 mb-4">
                        {order.items.slice(0, 4).map((item, j) => (
                          <div key={j} className="relative w-12 h-16 rounded-sm border border-brand-blue/5 dark:border-white/10 overflow-hidden shrink-0">
                            <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] uppercase tracking-widest font-bold">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </p>
                        <p className="font-serif text-lg text-brand-blue dark:text-brand-beige">₹{total.toLocaleString('en-IN')}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
