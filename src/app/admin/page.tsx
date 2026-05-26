"use client";

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, getDocs, query, orderBy, limit, addDoc, deleteDoc, doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { Package, ShoppingBag, Users, TrendingUp, Plus, X, Edit2, Trash2, Send, Megaphone, Download, Save, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { sendUserNotification, broadcastNotification } from '../../lib/notifications';
import AdminNotificationBell from '../../components/AdminNotificationBell';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, userData } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Sarees',
    description: '',
    image: '',
    isTrending: false,
    stock: '10'
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Broadcast Notification State
  const [broadcast, setBroadcast] = useState({
    title: '',
    message: '',
    link: '',
    targetUser: 'all', // 'all' or specific userId
    type: 'offer' as any
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Bulk Stock State
  const [bulkStock, setBulkStock] = useState<{[key: string]: number}>({});
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    // If not logged in, wait. If logged in but not admin/moderator, redirect
    if (userData && (userData.role !== 'admin' && userData.role !== 'moderator')) {
      router.push('/');
    }
  }, [userData, router]);

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
  const isAdmin = userData?.role === 'admin' || (user?.email ? adminEmails.includes(user.email.toLowerCase()) : false);
  const isModerator = userData?.role === 'moderator';
  const hasAccess = isAdmin || isModerator;

  useEffect(() => {
    if (hasAccess) {
      fetchAdminData();
      fetchGiftCards();
    }
  }, [hasAccess]);

  const fetchGiftCards = async () => {
    const gcSnap = await getDocs(query(collection(db, 'giftCards'), orderBy('createdAt', 'desc')));
    setGiftCards(gcSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    const couponSnap = await getDocs(query(collection(db, 'coupons'), orderBy('createdAt', 'desc')));
    setCoupons(couponSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchAdminData = async () => {
    try {
      // Fetch recent orders
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50)));
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch products (fetch all for admin view)
      const productsSnap = await getDocs(query(collection(db, 'products')));
      // Sort in JS: put items with createdAt first (newest), then the rest
      const fetchedProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      fetchedProducts.sort((a, b) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        return 0;
      });
      setProducts(fetchedProducts);

      // Fetch users
      const usersSnap = await getDocs(query(collection(db, 'users')));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price as string),
        stock: parseInt(newProduct.stock as string, 10),
        createdAt: new Date().toISOString()
      };
      
      if (editingProductId) {
        // Update existing product
        const docRef = doc(db, 'products', editingProductId);
        await updateDoc(docRef, productData);
        setProducts(products.map(p => p.id === editingProductId ? { id: p.id, ...productData } : p));
      } else {
        // Add new product
        const docRef = await addDoc(collection(db, 'products'), productData);
        setProducts([{ id: docRef.id, ...productData }, ...products]);
      }
      
      setIsProductModalOpen(false);
      setEditingProductId(null);
      setNewProduct({ name: '', price: '', category: 'Sarees', description: '', image: '', isTrending: false, stock: '10' });
      toast.success("Product saved successfully!");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product. Make sure you are an admin!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this masterpiece?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
      toast.success("Product deleted.");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, userEmail?: string, userName?: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // 1. Trigger Automated Email for Shipped/Delivered
      if (newStatus === 'shipped' || newStatus === 'delivered') {
        await fetch('/api/notify-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            type: newStatus === 'shipped' ? 'order_shipped' : 'order_delivered',
            orderId: orderId,
            productName: userName || 'Customer'
          })
        }).catch(e => console.error("Failed to send status update email", e));
      }

      // Send In-App Notification
      await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'targeted',
          userId: order.userId,
          notification: {
            title: `Order ${newStatus.toUpperCase()}`,
            message: `Your order #${orderId.toUpperCase()} is now ${newStatus}.`,
            type: 'order',
            link: `/order/${orderId}`
          }
        })
      });
      toast.success("Order status updated.");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status.");
    }
  };

  const exportOrdersToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Status', 'Amount'];
    const rows = orders.map(o => [
      o.id,
      o.shipping?.fullName || 'Anonymous',
      o.shipping?.email || 'N/A',
      new Date(o.createdAt).toLocaleDateString(),
      o.status,
      o.total
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `navanika-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkStockUpdate = async () => {
    if (Object.keys(bulkStock).length === 0) {
      toast.info("No changes to update");
      return;
    }
    setIsBulkUpdating(true);
    try {
      const promises = Object.entries(bulkStock).map(([id, stock]) => 
        updateDoc(doc(db, 'products', id), { stock: Number(stock) })
      );
      await Promise.all(promises);
      setProducts(products.map(p => bulkStock[p.id] !== undefined ? { ...p, stock: bulkStock[p.id] } : p));
      setBulkStock({});
      toast.success("Bulk stock updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bulk stock.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleHandleRequest = async (orderId: string, type: 'return' | 'exchange' | 'cancellation', decision: 'approved' | 'rejected') => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (type === 'cancellation' && decision === 'approved') {
        const batch = writeBatch(db);

        // 1. Restore stock
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { stock: increment(item.quantity) });
        }
        
        // 2. Update status
        batch.update(orderRef, {
          status: 'cancelled',
          'cancellationRequest.status': 'approved',
          cancelledAt: new Date().toISOString()
        });

        await batch.commit();

        // 3. Send Notification Email (Try to find email in shipping or userId)
        const recipientEmail = order.shipping.email || (order.userId?.includes('@') ? order.userId : null);
        
        console.log(`[ADMIN] Approving cancellation for ${orderId}. Recipient: ${recipientEmail}, Type: ${order.cancellationRequest.type}`);

        if (recipientEmail) {
          const notifyRes = await fetch('/api/notify-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: recipientEmail,
              type: 'order_refunded',
              orderId: orderId,
              productName: order.total.toLocaleString(),
              cartLink: order.cancellationRequest.type // Use this as flag for exchange vs refund
            })
          });
          
          if (!notifyRes.ok) {
            console.error("Failed to send cancellation email");
            toast.warning("Order approved, but notification email could not be sent. Please notify the customer manually.");
          } else {
            console.log("[ADMIN] Cancellation email sent successfully");
          }
        } else {
          console.warn("[ADMIN] No recipient email found for order", orderId);
          toast.warning("Order approved, but no email address was found for the customer. Please notify them via phone.");
        }

        // Send In-App Notification
        await fetch('/api/admin/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'targeted',
            userId: order.userId,
            notification: {
              title: `Cancellation Approved`,
              message: `Your ${order.cancellationRequest.type || 'cancellation'} request for Order #${orderId.toUpperCase()} has been approved.`,
              type: 'order',
              link: `/order/${orderId}`
            }
          })
        });
      } else if (type === 'cancellation' && decision === 'rejected') {
        await updateDoc(orderRef, {
          status: 'processing', // Revert to processing or previous
          'cancellationRequest.status': 'rejected'
        });
      } else {
        // Original return/exchange logic
        const request = order.returnRequest;
        await updateDoc(orderRef, {
          'returnRequest.status': decision,
          status: decision === 'approved' ? (request.type === 'return' ? 'returned' : 'exchanged') : order.status
        });
      }

      setOrders(orders.map(o => {
        if (o.id !== orderId) return o;
        if (type === 'cancellation') {
          return { 
            ...o, 
            status: decision === 'approved' ? 'cancelled' : 'processing',
            cancellationRequest: { ...o.cancellationRequest, status: decision }
          };
        }
        return { 
          ...o, 
          status: decision === 'approved' ? (o.returnRequest.type === 'return' ? 'returned' : 'exchanged') : o.status,
          returnRequest: { ...o.returnRequest, status: decision }
        };
      }));

      toast.success(`Request ${decision} successfully.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process request.");
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to make this user an ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role.");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) {
      toast.error("Title and message required");
      return;
    }
    
    setSendingBroadcast(true);
    try {
      const notification = {
        title: broadcast.title,
        message: broadcast.message,
        type: broadcast.type,
        link: broadcast.link || '/'
      };

      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: broadcast.targetUser === 'all' ? 'broadcast' : 'targeted',
          userId: broadcast.targetUser === 'all' ? null : broadcast.targetUser,
          notification
        })
      });

      if (res.ok) {
        toast.success(broadcast.targetUser === 'all' ? "Broadcast sent successfully!" : "Notification sent to user!");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to send notification");
      }

      setBroadcast({ title: '', message: '', link: '', targetUser: 'all', type: 'offer' });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send notification");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleGenerateGiftCard = async (amount: number) => {
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const code = `NAV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'giftCards', code), {
        amount,
        isUsed: false,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      fetchGiftCards();
      toast.success(`Gift card generated: ${code}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate gift card");
    }
  };

  const handleGenerateCoupon = async (code: string, discount: number) => {
    if (!code || !discount || discount <= 0) {
      toast.error("Please enter a valid code and discount");
      return;
    }
    
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'coupons', code.toUpperCase()), {
        discount, // percentage
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid
      });
      fetchGiftCards();
      toast.success(`Coupon ${code.toUpperCase()} generated with ${discount}% discount!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate coupon");
    }
  };

  const openEditModal = (product: any) => {
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description,
      image: product.image,
      isTrending: product.isTrending || false,
      stock: product.stock !== undefined ? product.stock.toString() : '0'
    });
    setEditingProductId(product.id);
    setIsProductModalOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 bg-brand-beige dark:bg-brand-blue">
        <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 pb-20 bg-brand-beige dark:bg-brand-blue transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-serif text-brand-blue dark:text-brand-beige">Admin Panel</h1>
            {isModerator && (
              <span className="flex items-center gap-1.5 bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-brand-gold/20">
                <ShieldCheck size={12} /> Moderator Access
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={exportOrdersToCSV}
              className="flex items-center gap-2 text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-gold transition-colors text-[10px] uppercase tracking-widest font-black"
            >
              <Download size={14} /> Export CSV
            </button>
            <AdminNotificationBell />
            <button 
              onClick={() => router.push('/')}
              className="text-[10px] uppercase tracking-widest font-black text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-blue dark:hover:text-brand-beige"
            >
              Exit
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-white/5 p-6 border border-brand-blue/10 dark:border-white/10 rounded-sm">
            <div className="flex items-center gap-4 mb-4 text-brand-gold">
              <TrendingUp size={24} />
              <h3 className="text-sm uppercase tracking-widest font-black">Total Revenue</h3>
            </div>
            <p className="text-3xl font-serif text-brand-blue dark:text-brand-beige">
              ₹{orders.reduce((acc, o) => acc + (o.amount || 0), 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white dark:bg-white/5 p-6 border border-brand-blue/10 dark:border-white/10 rounded-sm">
            <div className="flex items-center gap-4 mb-4 text-brand-gold">
              <ShoppingBag size={24} />
              <h3 className="text-sm uppercase tracking-widest font-black">Total Orders</h3>
            </div>
            <p className="text-3xl font-serif text-brand-blue dark:text-brand-beige">{orders.length}</p>
          </div>

          <div className="bg-white dark:bg-white/5 p-6 border border-brand-blue/10 dark:border-white/10 rounded-sm">
            <div className="flex items-center gap-4 mb-4 text-brand-gold">
              <Package size={24} />
              <h3 className="text-sm uppercase tracking-widest font-black">Products</h3>
            </div>
            <p className="text-3xl font-serif text-brand-blue dark:text-brand-beige">{products.length}</p>
          </div>

          <div className="bg-white dark:bg-white/5 p-6 border border-brand-blue/10 dark:border-white/10 rounded-sm">
            <div className="flex items-center gap-4 mb-4 text-brand-gold">
              <Users size={24} />
              <h3 className="text-sm uppercase tracking-widest font-black">Customers</h3>
            </div>
            <p className="text-3xl font-serif text-brand-blue dark:text-brand-beige">{users.length}</p>
          </div>
        </div>

        {/* Charts Section */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-white/5 p-8 border border-brand-blue/10 dark:border-white/10 rounded-sm">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-blue/50 dark:text-brand-beige/50 mb-8">Revenue Trends (Recent 7 Orders)</h3>
              <div className="flex items-end gap-2 h-40">
                {orders.slice(0, 7).reverse().map((o, i) => {
                  const max = Math.max(...orders.slice(0, 7).map(o => o.total || 0));
                  const height = ((o.total || 0) / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="relative w-full bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors rounded-t-sm overflow-hidden" style={{ height: `${height}%` }}>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: '100%' }}
                          className="absolute bottom-0 left-0 right-0 bg-brand-gold"
                        />
                      </div>
                      <span className="text-[8px] font-mono text-brand-blue/30 dark:text-brand-beige/30">₹{Math.floor((o.total || 0)/1000)}k</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white dark:bg-white/5 p-8 border border-brand-blue/10 dark:border-white/10 rounded-sm">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-blue/50 dark:text-brand-beige/50 mb-8">Order Status Distribution</h3>
              <div className="flex flex-col gap-4">
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => {
                  const count = orders.filter(o => (o.status || 'pending') === status).length;
                  const percent = (count / orders.length) * 100 || 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold">
                        <span className="text-brand-blue/60 dark:text-brand-beige/60">{status}</span>
                        <span className="text-brand-gold">{count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-brand-blue/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className={`h-full ${status === 'delivered' ? 'bg-green-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-brand-gold'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 md:gap-8 mb-8 overflow-x-auto pb-2 scrollbar-hide border-b border-brand-blue/5 dark:border-white/5 px-2">
          <button 
            className={`pb-4 text-sm uppercase tracking-widest font-black transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-blue dark:hover:text-brand-beige'}`}
            onClick={() => setActiveTab('overview')}
          >
            Recent Orders
          </button>
          <button 
            className={`pb-4 text-sm uppercase tracking-widest font-black transition-colors whitespace-nowrap ${activeTab === 'products' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-blue dark:hover:text-brand-beige'}`}
            onClick={() => setActiveTab('products')}
          >
            Inventory
          </button>
          <button 
            className={`pb-4 text-sm uppercase tracking-widest font-black transition-colors whitespace-nowrap ${activeTab === 'users' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-blue dark:hover:text-brand-beige'}`}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button 
            className={`pb-4 text-sm uppercase tracking-widest font-black transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-blue dark:hover:text-brand-beige'}`}
            onClick={() => setActiveTab('requests')}
          >
            Exchange/Returns
          </button>
          <button 
            className={`pb-4 text-sm uppercase tracking-widest font-black transition-colors whitespace-nowrap ${activeTab === 'broadcast' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-blue dark:hover:text-brand-beige'}`}
            onClick={() => setActiveTab('broadcast')}
          >
            Broadcast
          </button>
          <button 
            className={`pb-4 text-sm uppercase tracking-widest font-black transition-colors whitespace-nowrap ${activeTab === 'giftcards' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-blue/50 dark:text-brand-beige/50 hover:text-brand-blue dark:hover:text-brand-beige'}`}
            onClick={() => setActiveTab('giftcards')}
          >
            Gift Cards
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full" />
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && (
              <div className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 rounded-sm overflow-x-auto scrollbar-hide">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-brand-blue/5 dark:bg-white/5 text-[10px] uppercase tracking-widest font-black text-brand-blue/60 dark:text-brand-beige/60">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-brand-blue dark:text-brand-beige">
                    {orders.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center opacity-50">No orders yet.</td></tr>
                    )}
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-brand-blue/10 dark:border-white/10 hover:bg-brand-blue/5 dark:hover:bg-white/5">
                        <td className="p-4 font-mono text-xs">{order.id}</td>
                        <td className="p-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <select 
                            value={order.status || 'pending'} 
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value, order.shipping.email || order.userId, order.shipping.fullName)}
                            className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm outline-none cursor-pointer border-none bg-transparent ${order.status === 'completed' || order.status === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}
                          >
                            <option value="pending" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Pending</option>
                            <option value="processing" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Processing</option>
                            <option value="cancellation_pending" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Cancellation Requested</option>
                            <option value="shipped" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Shipped</option>
                            <option value="delivered" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Delivered</option>
                            <option value="cancelled" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Cancelled</option>
                            <option value="returned" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Returned</option>
                            <option value="exchanged" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">Exchanged</option>
                          </select>
                        </td>
                        <td className="p-4 text-right font-serif whitespace-nowrap">₹{order.total?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif text-brand-blue dark:text-brand-beige">Inventory</h3>
                  <div className="flex gap-4">
                    {Object.keys(bulkStock).length > 0 && (
                      <button 
                        onClick={handleBulkStockUpdate}
                        disabled={isBulkUpdating}
                        className="flex items-center gap-2 bg-brand-blue dark:bg-white dark:text-brand-blue text-white px-4 py-2 text-[10px] uppercase tracking-widest font-black rounded-sm hover:bg-brand-gold transition-colors disabled:opacity-50"
                      >
                        <Save size={14} /> {isBulkUpdating ? 'Updating...' : `Save ${Object.keys(bulkStock).length} Changes`}
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEditingProductId(null);
                        setNewProduct({ name: '', price: '', category: 'Sarees', description: '', image: '', isTrending: false, stock: '10' });
                        setIsProductModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-brand-gold text-white px-4 py-2 text-[10px] uppercase tracking-widest font-black rounded-sm hover:bg-brand-blue transition-colors"
                    >
                      <Plus size={14} /> Add Masterpiece
                    </button>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 rounded-sm overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-brand-blue/5 dark:bg-white/5 text-[10px] uppercase tracking-widest font-black text-brand-blue/60 dark:text-brand-beige/60">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4 text-right">Price</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-brand-blue dark:text-brand-beige">
                      {products.map((product) => (
                        <tr key={product.id} className="border-t border-brand-blue/10 dark:border-white/10 hover:bg-brand-blue/5 dark:hover:bg-white/5">
                          <td className="p-4 flex items-center gap-4">
                            <div className="relative w-10 h-14 shrink-0 rounded-sm overflow-hidden">
                              <Image src={product.image} fill sizes="40px" alt={product.name} className="object-cover" />
                            </div>
                            <span className="font-serif whitespace-nowrap">{product.name}</span>
                          </td>
                          <td className="p-4 uppercase tracking-widest text-[10px] font-black">{product.category}</td>
                          <td className="p-4">
                            <input 
                              type="number"
                              value={bulkStock[product.id] !== undefined ? bulkStock[product.id] : (product.stock || 0)}
                              onChange={e => setBulkStock({ ...bulkStock, [product.id]: parseInt(e.target.value) })}
                              className="w-20 bg-brand-blue/5 dark:bg-white/5 border border-brand-gold/20 p-2 rounded-sm outline-none text-xs text-brand-blue dark:text-brand-beige focus:border-brand-gold transition-colors"
                            />
                          </td>
                          <td className="p-4 text-right font-serif whitespace-nowrap">₹{product.price?.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal(product)} className="p-2 text-brand-blue/50 hover:text-brand-gold dark:text-brand-beige/50 transition-colors" title="Edit Product">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-brand-blue/50 hover:text-red-500 dark:text-brand-beige/50 transition-colors" title="Delete Product">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif text-brand-blue dark:text-brand-beige">User Directory</h3>
                </div>
                
                <div className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 rounded-sm overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-brand-blue/5 dark:bg-white/5 text-[10px] uppercase tracking-widest font-black text-brand-blue/60 dark:text-brand-beige/60">
                      <tr>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4 text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-brand-blue dark:text-brand-beige">
                      {users.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center opacity-50">No users found.</td></tr>
                      )}
                      {users.map((u) => (
                        <tr key={u.id} className="border-t border-brand-blue/10 dark:border-white/10 hover:bg-brand-blue/5 dark:hover:bg-white/5">
                          <td className="p-4 flex items-center gap-4">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand-gold shrink-0">
                              <Image src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName}`} fill sizes="32px" alt={u.displayName || 'User'} className="object-cover" />
                            </div>
                            <span className="font-serif whitespace-nowrap">{u.displayName || 'Anonymous User'}</span>
                          </td>
                          <td className="p-4 whitespace-nowrap">{u.email || 'N/A'}</td>
                          <td className="p-4 whitespace-nowrap">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-4 text-right">
                            <select 
                              value={u.role || 'user'} 
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              disabled={u.id === user?.uid} // Can't change own role to avoid locking out
                              className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm outline-none cursor-pointer border border-brand-blue/10 dark:border-white/10 bg-transparent ${u.role === 'admin' ? 'text-brand-gold' : ''}`}
                            >
                              <option value="user" className="bg-brand-beige dark:bg-brand-blue text-brand-blue dark:text-brand-beige">User</option>
                              <option value="admin" className="bg-brand-beige dark:bg-brand-blue text-brand-gold">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 rounded-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-brand-blue/5 dark:bg-white/5 text-[10px] uppercase tracking-widest font-black text-brand-blue/60 dark:text-brand-beige/60">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Request</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-brand-blue dark:text-brand-beige">
                    {orders.filter(o => o.returnRequest || o.cancellationRequest).length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center opacity-50">No requests pending.</td></tr>
                    )}
                    {/* Cancellation Requests */}
                    {orders.filter(o => o.cancellationRequest).map((order) => (
                      <tr key={`cancel-${order.id}`} className="border-t border-brand-blue/10 dark:border-white/10 hover:bg-brand-blue/5 dark:hover:bg-white/5">
                        <td className="p-4">
                          <p className="font-serif">{order.shipping.fullName}</p>
                          <p className="text-[10px] font-mono opacity-50">#{order.id}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm font-black ${order.cancellationRequest.type === 'exchange' ? 'bg-brand-gold text-white' : 'bg-red-500 text-white'}`}>
                            {order.cancellationRequest.type || 'Cancellation'}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-xs">{order.cancellationRequest.reason}</p>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] uppercase tracking-widest font-black ${order.cancellationRequest.status === 'pending' ? 'text-yellow-500' : order.cancellationRequest.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                            {order.cancellationRequest.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {order.cancellationRequest.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleHandleRequest(order.id, 'cancellation', 'approved')}
                                className="bg-green-500 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm hover:bg-green-600 transition-colors"
                              >
                                Approve & Refund
                              </button>
                              <button 
                                onClick={() => handleHandleRequest(order.id, 'cancellation', 'rejected')}
                                className="bg-red-500 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Return/Exchange Requests */}
                    {orders.filter(o => o.returnRequest).map((order) => (
                      <tr key={`return-${order.id}`} className="border-t border-brand-blue/10 dark:border-white/10 hover:bg-brand-blue/5 dark:hover:bg-white/5">
                        <td className="p-4">
                          <p className="font-serif">{order.shipping.fullName}</p>
                          <p className="text-[10px] font-mono opacity-50">#{order.id}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm font-black ${order.returnRequest.type === 'exchange' ? 'bg-brand-gold text-white' : 'bg-brand-blue text-white'}`}>
                            {order.returnRequest.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-xs">{order.returnRequest.reason}</p>
                          <p className="text-xs opacity-60 mt-1">{order.returnRequest.details}</p>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] uppercase tracking-widest font-black ${order.returnRequest.status === 'pending' ? 'text-yellow-500' : order.returnRequest.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                            {order.returnRequest.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {order.returnRequest.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleHandleRequest(order.id, (order.returnRequest.type as any), 'approved')}
                                className="bg-green-500 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm hover:bg-green-600 transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleHandleRequest(order.id, (order.returnRequest.type as any), 'rejected')}
                                className="bg-red-500 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm hover:bg-red-600 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

        {/* Add Product Modal */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-brand-blue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-beige dark:bg-brand-blue border border-brand-gold/30 p-8 rounded-sm max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-4 right-4 text-brand-blue/50 hover:text-brand-gold dark:text-brand-beige/50 dark:hover:text-brand-gold transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-serif text-brand-blue dark:text-brand-beige mb-6">
                {editingProductId ? 'Edit Masterpiece' : 'Add New Masterpiece'}
              </h2>
              
              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-brand-gold mb-2">Product Name</label>
                  <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 dark:border-white/10 p-3 rounded-sm outline-none focus:border-brand-gold text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-brand-gold mb-2">Price (₹)</label>
                    <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 dark:border-white/10 p-3 rounded-sm outline-none focus:border-brand-gold text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-brand-gold mb-2">Category</label>
                    <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 dark:border-white/10 p-3 rounded-sm outline-none focus:border-brand-gold text-sm">
                      <option value="Sarees">Sarees</option>
                      <option value="Formal">Formal</option>
                      <option value="Casual">Casual</option>
                      <option value="Fashion">Fashion</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-brand-gold mb-2">Stock Quantity</label>
                    <input required type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 dark:border-white/10 p-3 rounded-sm outline-none focus:border-brand-gold text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-brand-gold mb-2">Image URL</label>
                    <input required type="url" placeholder="https://..." value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 dark:border-white/10 p-3 rounded-sm outline-none focus:border-brand-gold text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-brand-gold mb-2">Description</label>
                  <textarea required rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 dark:border-white/10 p-3 rounded-sm outline-none focus:border-brand-gold text-sm"></textarea>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="trending" checked={newProduct.isTrending} onChange={e => setNewProduct({...newProduct, isTrending: e.target.checked})} className="accent-brand-gold" />
                  <label htmlFor="trending" className="text-[10px] uppercase tracking-widest font-black text-brand-blue dark:text-brand-beige cursor-pointer">Mark as Trending</label>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 bg-brand-gold text-white py-4 text-[10px] uppercase tracking-[0.3em] font-black rounded-sm hover:bg-brand-blue transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingProductId ? 'Save Changes' : 'Publish Masterpiece')}
                </button>
              </form>
            </div>
          </div>
        )}

          {/* Broadcast Tab */}
          {activeTab === 'broadcast' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white dark:bg-white/5 border border-brand-gold/10 p-8 rounded-sm">
              <div className="flex items-center gap-3 mb-8">
                <Megaphone className="text-brand-gold" />
                <div>
                  <h2 className="text-xl font-serif text-brand-blue dark:text-brand-beige">Broadcast Message</h2>
                  <p className="text-[10px] uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40">Notify your customers instantly</p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-brand-blue/50 dark:text-brand-beige/50 block mb-2">Recipient</label>
                  <select 
                    value={broadcast.targetUser}
                    onChange={e => setBroadcast({...broadcast, targetUser: e.target.value})}
                    className="w-full bg-brand-blue/5 dark:bg-black/20 border border-brand-blue/10 dark:border-white/10 p-4 rounded-sm outline-none text-sm text-brand-blue dark:text-brand-beige focus:border-brand-gold transition-colors"
                  >
                    <option value="all">All Registered Users ({users.length})</option>
                    <optgroup label="Specific User">
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.displayName || u.email || 'Anonymous'}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-blue/50 dark:text-brand-beige/50 block mb-2">Notification Type</label>
                    <select 
                      value={broadcast.type}
                      onChange={e => setBroadcast({...broadcast, type: e.target.value as any})}
                      className="w-full bg-brand-blue/5 dark:bg-black/20 border border-brand-blue/10 dark:border-white/10 p-4 rounded-sm outline-none text-sm text-brand-blue dark:text-brand-beige focus:border-brand-gold transition-colors"
                    >
                      <option value="offer">Special Offer / Discount</option>
                      <option value="product">New Arrival / Product Update</option>
                      <option value="system">System Announcement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-brand-blue/50 dark:text-brand-beige/50 block mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Exclusive 20% Off Heritage Sarees"
                    value={broadcast.title}
                    onChange={e => setBroadcast({...broadcast, title: e.target.value})}
                    className="w-full bg-brand-blue/5 dark:bg-black/20 border border-brand-blue/10 dark:border-white/10 p-4 rounded-sm outline-none text-sm text-brand-blue dark:text-brand-beige focus:border-brand-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-brand-blue/50 dark:text-brand-beige/50 block mb-2">Target Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., /product/saree-id or /"
                    value={broadcast.link}
                    onChange={e => setBroadcast({...broadcast, link: e.target.value})}
                    className="w-full bg-brand-blue/5 dark:bg-black/20 border border-brand-blue/10 dark:border-white/10 p-4 rounded-sm outline-none text-sm text-brand-blue dark:text-brand-beige focus:border-brand-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-brand-blue/50 dark:text-brand-beige/50 block mb-2">Message</label>
                  <textarea
                    placeholder="Describe your offer or update..."
                    rows={4}
                    value={broadcast.message}
                    onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                    className="w-full bg-brand-blue/5 dark:bg-black/20 border border-brand-blue/10 dark:border-white/10 p-4 rounded-sm outline-none text-sm text-brand-blue dark:text-brand-beige focus:border-brand-gold transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={sendingBroadcast}
                  className="w-full bg-brand-gold text-white py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {sendingBroadcast ? 'Sending...' : <><Send size={14} /> Send Notification</>}
                </button>
              </form>
            </motion.div>
          )}

            {activeTab === 'giftcards' && (
              <div className="space-y-12">
                {/* Gift Cards Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-white/5 p-6 md:p-8 border border-brand-blue/10 dark:border-white/10 rounded-sm">
                    <h3 className="text-lg md:text-xl font-serif text-brand-blue dark:text-brand-beige mb-6">Generate Gift Card</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="number" 
                        placeholder="Amount (₹)" 
                        id="gcAmount"
                        className="flex-1 bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-6 py-4 rounded-sm text-brand-blue dark:text-brand-beige outline-none focus:border-brand-gold transition-colors"
                      />
                      <button 
                        onClick={() => handleGenerateGiftCard(Number((document.getElementById('gcAmount') as HTMLInputElement).value))}
                        className="bg-brand-gold text-white px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand-blue transition-colors rounded-sm"
                      >
                        GENERATE
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/5 p-6 md:p-8 border border-brand-blue/10 dark:border-white/10 rounded-sm">
                    <h3 className="text-lg md:text-xl font-serif text-brand-blue dark:text-brand-beige mb-6">Generate Coupon</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <input 
                          type="text" 
                          placeholder="Coupon Code (e.g. NAV20)" 
                          id="couponCode"
                          className="flex-1 bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-6 py-4 rounded-sm text-brand-blue dark:text-brand-beige outline-none focus:border-brand-gold transition-colors uppercase"
                        />
                        <input 
                          type="number" 
                          placeholder="Disc %" 
                          id="couponDiscount"
                          className="w-24 bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-6 py-4 rounded-sm text-brand-blue dark:text-brand-beige outline-none focus:border-brand-gold transition-colors"
                        />
                      </div>
                      <button 
                        onClick={() => handleGenerateCoupon(
                          (document.getElementById('couponCode') as HTMLInputElement).value,
                          Number((document.getElementById('couponDiscount') as HTMLInputElement).value)
                        )}
                        className="w-full bg-brand-blue dark:bg-white dark:text-brand-blue text-white px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand-gold transition-colors rounded-sm"
                      >
                        GENERATE COUPON
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Gift Cards Table */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-blue/40 dark:text-brand-beige/40 mb-4">Recent Gift Cards</h4>
                    <div className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 rounded-sm overflow-x-auto scrollbar-hide">
                      <table className="w-full text-left">
                        <thead className="bg-brand-blue/5 dark:bg-white/5 text-[10px] uppercase tracking-widest font-black text-brand-blue/60 dark:text-brand-beige/60">
                          <tr>
                            <th className="p-4">Code</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-brand-blue dark:text-brand-beige">
                          {giftCards.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center opacity-50">No gift cards.</td></tr>
                          )}
                          {giftCards.slice(0, 10).map((gc) => (
                            <tr key={gc.id} className="border-t border-brand-blue/10 dark:border-white/10">
                              <td className="p-4 font-mono text-brand-gold font-bold uppercase">{gc.id}</td>
                              <td className="p-4">₹{gc.amount.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm ${gc.isUsed ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                  {gc.isUsed ? 'REDEEMED' : 'ACTIVE'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Coupons Table */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-blue/40 dark:text-brand-beige/40 mb-4">Active Coupons</h4>
                    <div className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 rounded-sm overflow-x-auto scrollbar-hide">
                      <table className="w-full text-left">
                        <thead className="bg-brand-blue/5 dark:bg-white/5 text-[10px] uppercase tracking-widest font-black text-brand-blue/60 dark:text-brand-beige/60">
                          <tr>
                            <th className="p-4">Code</th>
                            <th className="p-4">Discount</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-brand-blue dark:text-brand-beige">
                          {coupons.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center opacity-50">No coupons.</td></tr>
                          )}
                          {coupons.map((c) => (
                            <tr key={c.id} className="border-t border-brand-blue/10 dark:border-white/10">
                              <td className="p-4 font-mono text-brand-gold font-bold uppercase">{c.id}</td>
                              <td className="p-4 font-bold">{c.discount}% OFF</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm ${!c.isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                  {c.isActive ? 'ACTIVE' : 'EXPIRED'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
