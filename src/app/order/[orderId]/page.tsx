"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Package, MapPin, ArrowRight, Clock, Truck, Check, X, FileText, Smartphone, Undo2, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { Order } from '../../../lib/orders';
import { updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelType, setCancelType] = useState<'refund' | 'exchange'>('refund');
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const [returning, setReturning] = useState(false);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchOrder = async () => {
      if (!orderId) return;
      const ref = doc(db, 'orders', orderId);
      const snap = await getDoc(ref);
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return alert("Please provide a reason for cancellation.");
    setCancelling(true);
    try {
      const res = await fetch('/api/order/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'cancel_request',
          reason: cancelReason,
          type: cancelType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      // Update local state
      const requestData = {
        reason: cancelReason,
        type: cancelType,
        status: 'pending',
        requestedAt: new Date().toISOString()
      };
      setOrder(prev => prev ? { ...prev, status: 'cancellation_pending', cancellationRequest: requestData as any } : null);
      setShowCancelModal(false);
      alert("Your cancellation request has been accepted. You will get an update soon.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) return alert("Please provide a reason.");
    setReturning(true);
    try {
      const res = await fetch('/api/order/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'return_request',
          type: returnType,
          reason: returnReason,
          details: returnDetails
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      const requestData = {
        type: returnType,
        reason: returnReason,
        details: returnDetails,
        status: 'pending',
        requestedAt: new Date().toISOString()
      };
      
      setOrder(prev => prev ? { ...prev, returnRequest: requestData as any } : null);
      setShowReturnModal(false);
      alert("Your request has been submitted for review.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit request.");
    } finally {
      setReturning(false);
    }
  };

  const generateInvoice = () => {
    if (!order) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(10, 17, 40); // brand-blue
    doc.text('NAVANIKA HERITAGE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('CLASSIC HERITAGE BOUTIQUE', 105, 27, { align: 'center' });
    
    doc.setDrawColor(197, 160, 89); // brand-gold
    doc.line(20, 35, 190, 35);
    
    // Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Invoice for Order: #${orderId.toUpperCase()}`, 20, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 52);
    
    doc.text('Shipping Address:', 20, 65);
    doc.setFontSize(10);
    doc.text(order.shipping.fullName, 20, 72);
    doc.text(order.shipping.address, 20, 77);
    doc.text(`${order.shipping.city}, ${order.shipping.state} - ${order.shipping.pincode}`, 20, 82);
    doc.text(`Phone: ${order.shipping.phone}`, 20, 87);

    // Table
    const tableData = order.items.map(item => [
      item.name,
      item.quantity,
      `INR ${item.price.toLocaleString()}`,
      `INR ${(item.price * item.quantity).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Product', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [10, 17, 40] }, // brand-blue
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.setFontSize(12);
    doc.text(`Subtotal: INR ${order.subtotal?.toLocaleString() || order.total.toLocaleString()}`, 140, finalY + 10);
    if (order.tax) doc.text(`GST (5%): INR ${order.tax.toLocaleString()}`, 140, finalY + 17);
    if (order.shippingFee) doc.text(`Shipping: INR ${order.shippingFee.toLocaleString()}`, 140, finalY + 24);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: INR ${order.total.toLocaleString()}`, 140, finalY + 35);
    
    doc.save(`Invoice_Navanika_${orderId.slice(0,8)}.pdf`);
  };

  const getStatusStep = () => {
    switch(order?.status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'confirmed': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  const isWithinReturnWindow = () => {
    if (order?.status !== 'delivered' || !order?.createdAt) return false;
    const deliveredDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    const diff = (new Date().getTime() - deliveredDate.getTime()) / (1000 * 3600 * 24);
    return diff <= 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-beige dark:bg-brand-blue flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-beige dark:bg-brand-blue flex flex-col items-center justify-center gap-6 pt-28">
        <p className="text-brand-blue/40 dark:text-brand-beige/40 font-serif italic text-2xl">Order not found.</p>
        <button onClick={() => router.push('/')} className="text-brand-gold text-[10px] uppercase tracking-widest font-black hover:underline">
          Go Home
        </button>
      </div>
    );
  }

  const total = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-brand-beige dark:bg-brand-blue pt-36 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-brand-blue dark:text-brand-beige mb-3">Order Confirmed!</h1>
          <p className="text-brand-blue/50 dark:text-brand-beige/50 text-[10px] uppercase tracking-[0.5em] font-black">Your heritage awaits</p>
        </motion.div>

        {/* Order ID */}
        <div className="bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-6 mb-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-brand-blue/40 dark:text-brand-beige/40 mb-1">Order ID</p>
          <p className="font-mono text-brand-blue dark:text-brand-beige text-sm font-bold">#{order.id?.slice(0, 12).toUpperCase()}</p>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-6">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-brand-blue/40 dark:text-brand-beige/40 flex items-center gap-2">
            <Package size={12} /> Items Ordered
          </p>
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4 bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-4">
              <div className="relative w-16 h-20 shrink-0 rounded-sm overflow-hidden">
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1 py-1">
                <p className="font-serif text-brand-blue dark:text-brand-beige">{item.name}</p>
                <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] uppercase tracking-widest font-bold mt-1">
                  Qty: {item.quantity} {item.size && `• Size: ${item.size}`}
                </p>
                <p className="text-brand-gold font-serif mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-8 mb-6">
            <div className="flex justify-between relative">
              {/* Line */}
              <div className="absolute top-4 left-0 w-full h-[2px] bg-brand-blue/10 dark:bg-white/10 -z-0" />
              <div 
                className="absolute top-4 left-0 h-[2px] bg-brand-gold transition-all duration-1000 -z-0" 
                style={{ width: `${((getStatusStep() - 1) / 3) * 100}%` }}
              />
              
              {[
                { label: 'Pending', icon: Clock, step: 1 },
                { label: 'Confirmed', icon: Package, step: 2 },
                { label: 'Shipped', icon: Truck, step: 3 },
                { label: 'Delivered', icon: CheckCircle, step: 4 }
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${getStatusStep() >= s.step ? 'bg-brand-gold border-brand-gold text-white' : 'bg-white dark:bg-brand-blue border-brand-blue/10 dark:border-white/10 text-brand-blue/20 dark:text-brand-beige/20'}`}>
                    {getStatusStep() > s.step ? <Check size={14} /> : <s.icon size={14} />}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${getStatusStep() >= s.step ? 'text-brand-blue dark:text-brand-beige' : 'text-brand-blue/30 dark:text-brand-beige/30'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === 'cancellation_pending' && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-sm p-6 mb-6 flex items-center gap-4">
            <Clock className="text-yellow-500" size={24} />
            <div>
              <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">Cancellation Requested</p>
              <p className="text-brand-blue/60 dark:text-brand-beige/60 text-xs mt-1">Our team is reviewing your cancellation request. You will receive an update soon.</p>
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-6 mb-6 flex items-center gap-4">
            <X className="text-red-500" size={24} />
            <div>
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Order Cancelled</p>
              <p className="text-brand-blue/60 dark:text-brand-beige/60 text-xs mt-1">Reason: {order.cancellationRequest?.reason || 'Cancelled'}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-brand-blue/40 dark:text-brand-beige/40 flex items-center gap-2 mb-3">
              <MapPin size={12} /> Delivering To
            </p>
            <p className="text-brand-blue dark:text-brand-beige font-medium text-sm">{order.shipping.fullName}</p>
            <p className="text-brand-blue/60 dark:text-brand-beige/60 text-xs mt-1 leading-relaxed">
              {order.shipping.address}<br />
              {order.shipping.city}, {order.shipping.state} — {order.shipping.pincode}
            </p>
          </div>
          <div className="bg-brand-blue dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-brand-beige/40">Order Total</p>
              <p className="text-4xl font-serif text-brand-beige mt-2">₹{order.total.toLocaleString('en-IN')}</p>
              <button 
                onClick={generateInvoice}
                className="mt-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-brand-gold hover:text-white transition-colors"
              >
                <FileText size={12} /> Download Invoice (PDF)
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 text-brand-beige/5 rotate-12">
              <ShoppingBag size={120} />
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {(order.status === 'pending' || order.status === 'processing' || order.status === 'confirmed') && (
            <button 
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 px-6 py-3 rounded-sm hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={14} /> Cancel Order
            </button>
          )}

          {order.status === 'delivered' && isWithinReturnWindow() && !order.returnRequest && (
            <>
              <button 
                onClick={() => { setReturnType('exchange'); setShowReturnModal(true); }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-gold border border-brand-gold/20 px-6 py-3 rounded-sm hover:bg-brand-gold hover:text-white transition-all"
              >
                <RefreshCw size={14} /> Exchange
              </button>
              <button 
                onClick={() => { setReturnType('return'); setShowReturnModal(true); }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-blue dark:text-brand-beige border border-brand-blue/10 dark:border-white/10 px-6 py-3 rounded-sm hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all"
              >
                <Undo2 size={14} /> Refund / Return
              </button>
            </>
          )}

          {order.returnRequest && (
            <div className="w-full bg-brand-gold/5 border border-brand-gold/20 rounded-sm p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2 text-brand-gold">
                <AlertCircle size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {order.returnRequest.type} Request {order.returnRequest.status}
                </p>
              </div>
              <p className="text-brand-blue/60 dark:text-brand-beige/60 text-xs italic">
                Our team is reviewing your {order.returnRequest.type} request. You'll be notified soon.
              </p>
            </div>
          )}
        </div>

        {/* MODALS */}
        <AnimatePresence>
          {showCancelModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-brand-blue/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-brand-beige dark:bg-brand-blue border border-brand-gold/30 p-8 rounded-sm max-w-md w-full relative">
                <h3 className="text-2xl font-serif text-brand-blue dark:text-brand-beige mb-6">Cancel Your Heritage</h3>
                <p className="text-sm text-brand-blue/60 dark:text-brand-beige/60 mb-6">How would you like us to process this request?</p>
                
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setCancelType('refund')}
                    className={`flex-1 py-3 border rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${cancelType === 'refund' ? 'bg-brand-gold border-brand-gold text-white' : 'border-brand-blue/10 dark:border-white/10 text-brand-blue/40'}`}
                  >
                    Full Refund
                  </button>
                  <button 
                    onClick={() => setCancelType('exchange')}
                    className={`flex-1 py-3 border rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${cancelType === 'exchange' ? 'bg-brand-gold border-brand-gold text-white' : 'border-brand-blue/10 dark:border-white/10 text-brand-blue/40'}`}
                  >
                    Exchange Piece
                  </button>
                </div>

                <textarea 
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Tell us more about your request..."
                  className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 p-4 rounded-sm outline-none text-sm mb-6 h-28"
                />
                <div className="flex gap-4">
                  <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest opacity-50">Back</button>
                  <button 
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="flex-1 bg-red-500 text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors rounded-sm"
                  >
                    {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showReturnModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-brand-blue/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-brand-beige dark:bg-brand-blue border border-brand-gold/30 p-8 rounded-sm max-w-md w-full relative">
                <h3 className="text-2xl font-serif text-brand-blue dark:text-brand-beige mb-6 capitalize">{returnType} Request</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-brand-gold mb-2">Primary Reason</label>
                    <select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 p-3 rounded-sm outline-none text-sm">
                      <option value="">Select a reason</option>
                      <option value="Sizing Issue">Sizing Issue</option>
                      <option value="Defective Product">Defective Product</option>
                      <option value="Different from Image">Different from Image</option>
                      <option value="Changed My Mind">Changed My Mind</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-brand-gold mb-2">Additional Details</label>
                    <textarea value={returnDetails} onChange={e => setReturnDetails(e.target.value)} placeholder="Provide more details for faster approval..." className="w-full bg-white dark:bg-black/20 border border-brand-blue/20 p-3 rounded-sm outline-none text-sm h-24" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowReturnModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest opacity-50">Cancel</button>
                  <button onClick={handleReturnRequest} disabled={returning} className="flex-1 bg-brand-gold text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue transition-colors rounded-sm">
                    {returning ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center space-y-4">
          <p className="text-brand-blue/40 dark:text-brand-beige/40 text-sm font-light italic">
            Expected delivery in 5–7 business days. You'll receive updates via email.
          </p>
          <div className="flex justify-center gap-6">
            <button
              onClick={() => router.push('/profile')}
              className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-blue dark:text-brand-beige hover:text-brand-gold transition-colors"
            >
              View Orders
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-black bg-brand-gold text-white px-6 py-3 hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all rounded-sm"
            >
              Continue Shopping <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
