"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, CheckCircle, CreditCard, Lock, ChevronRight, ArrowLeft, Package, Smartphone } from 'lucide-react';
import { ShippingInfo, OrderItem } from '../../lib/orders';

import { useApp } from '../../context/AppContext';


const STEPS = ['Shipping', 'Review', 'Payment'] as const;
type Step = typeof STEPS[number] | 'UPI_Verification';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cart, setIsAuthOpen } = useApp();
  
  const [step, setStep] = useState<Step>('Shipping');
  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: '', email: '', phone: '', address: '', city: '', state: '', pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod' | 'upi'>('online');
  const [utr, setUtr] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  const [paying, setPaying] = useState(false);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, shippingFee: 0, total: 0, gstRate: 5 });
  const [calculating, setCalculating] = useState(false);

  const fetchTotals = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/checkout/calculate-totals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart.map(item => ({ price: item.price, quantity: item.quantity })), 
          pincode: shipping.pincode 
        })
      });
      const data = await res.json();
      if (res.ok) setTotals(data);
    } catch (err) {
      console.error('Failed to calculate totals', err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (step === 'Review' && shipping.pincode.length >= 6) {
      fetchTotals();
    }
  }, [step, shipping.pincode, cart]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const stepIndex = step === 'UPI_Verification' ? 2 : STEPS.indexOf(step as any);

  useEffect(() => {
    if (!user) { 
      setIsAuthOpen(true); 
      router.push('/'); 
    }
  }, [user, router, setIsAuthOpen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('Review');
  };

  const sendNotifications = async (orderId: string) => {
    try {
      await fetch('/api/notify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          phone: shipping.phone,
          orderId,
          method: paymentMethod
        })
      });
    } catch (err) {
      console.error("Failed to notify", err);
    }
  };

  const handleCOD = async () => {
    setPaying(true);
    setStep('Payment');
    try {
      console.log('🔵 Starting COD checkout with cart items:', cart.length);
      
      const items: OrderItem[] = cart.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        size: item.size,
      }));

      const mockPaymentId = `cod_${Date.now()}`;

      console.log('🔵 Placing COD order...', { userId: user!.uid, itemsCount: items.length });

      // Stock enforced + order created atomically
      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.uid,
          items,
          shipping,
          paymentId: mockPaymentId,
          paymentMethod: 'cod',
        }),
      });

      console.log('🔵 Place order response status:', res.status);
      const data = await res.json();
      console.log('🔵 Place order response:', data);

      if (!res.ok) {
        const errorMsg = data?.error || 'Error processing your COD order';
        console.error('❌ Order placement failed:', errorMsg);
        alert(errorMsg);
        setStep('Review');
        setPaying(false);
        return;
      }

      const orderId = data.orderId as string;
      console.log('🔵 Order created successfully! ID:', orderId);

      // Clear cart AFTER order is created
      console.log('🔵 Clearing cart...');
      await fetch('/api/checkout/clear-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.uid, cartItems: cart.map((c) => ({ id: c.id })) }),
      });

      console.log('🔵 Sending notifications...');
      await sendNotifications(orderId);
      
      console.log('🔵 Redirecting to order page:', `/order/${orderId}`);
      router.push(`/order/${orderId}`);
    } catch (err) {
      console.error('❌ COD Error:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert("Error processing your COD order: " + errorMsg);
      setStep('Review');
      setPaying(false);
    }
  };

  const handleGPay = async () => {
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi';
    const merchantName = encodeURIComponent('Navanika Heritage');
    const transactionNote = encodeURIComponent(`Order_${Date.now()}`);
    
    if (isMobile) {
      const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${totals.total}&tn=${transactionNote}&cu=INR`;
      window.location.href = upiUrl;
    }
    
    setStep('UPI_Verification');
  };

  const handleUPIOrder = async () => {
    if (!utr) {
      alert("Please enter the Transaction ID / UTR provided by GPay");
      return;
    }

    setPaying(true);
    try {
      const items: OrderItem[] = cart.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        size: item.size,
      }));

      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.uid,
          items,
          shipping,
          paymentId: utr,
          paymentMethod: 'upi',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'Error placing your order');
        setPaying(false);
        return;
      }

      await fetch('/api/checkout/clear-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.uid, cartItems: cart.map((c) => ({ id: c.id })) }),
      });

      await sendNotifications(data.orderId);
      router.push(`/order/${data.orderId}`);
    } catch (err) {
      console.error(err);
      alert("Error processing UPI order");
      setPaying(false);
    }
  };

  const handlePayment = async () => {

    setPaying(true);
    setStep('Payment');
    try {
      // 1. Create Razorpay Order on Backend
      const response = await fetch('/api/checkout/razorpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totals.total })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to create order: ${response.status} ${response.statusText}`);
      }

      const order = await response.json();

      if (!order || !order.id) {
        throw new Error("Failed to create order on server");
      }

      // 2. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock', // Fallback for dev

        amount: order.amount,
        currency: order.currency,
        name: "Navanika Heritage",
        description: "Order Payment",
        order_id: order.id,
        prefill: {
          name: shipping.fullName,
          contact: shipping.phone,
        },
        theme: {
          color: "#c2a373" // brand gold
        },
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // 4. Place order (stock enforced server-side)
              const items: OrderItem[] = cart.map(item => ({
                productId: item.productId || item.id,

                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                size: item.size,
              }));

              const res = await fetch('/api/checkout/place-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user!.uid,
                  items,
                  shipping,
                  paymentId: response.razorpay_payment_id,
                  paymentMethod: 'online',
                }),
              });

              const data = await res.json();
              if (!res.ok) {
                alert(data?.error || 'Error placing your order');
                setStep('Review');
                setPaying(false);
                return;
              }

              const orderId = data.orderId as string;

              // Clear cart AFTER order is created
              await fetch('/api/checkout/clear-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user!.uid, cartItems: cart.map((c) => ({ id: c.id })) }),
              });

              await sendNotifications(orderId);
              router.push(`/order/${orderId}`);




            } else {
              alert("Payment verification failed!");
              setStep('Review');
              setPaying(false);
            }
          } catch (err) {
            console.error("Verification error", err);
            alert("Error verifying payment");
            setStep('Review');
            setPaying(false);
          }
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        console.error("Payment Failed", response.error);
        alert(response.error.description || "Payment failed");
        setStep('Review');
        setPaying(false);
      });
      
      rzp1.open();

    } catch (err) {
      console.error(err);
      alert("Error initiating payment");
      setStep('Review');
      setPaying(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-beige dark:bg-brand-blue pt-36 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => stepIndex > 0 ? setStep(STEPS[stepIndex - 1]) : router.back()}
          className="flex items-center gap-2 text-brand-blue/40 dark:text-brand-beige/40 hover:text-brand-blue dark:hover:text-brand-beige text-[10px] uppercase tracking-[0.3em] font-black mb-12 transition-colors"
        >
          <ArrowLeft size={14} /> {stepIndex > 0 ? 'Back' : 'Back to Cart'}
        </button>

        {/* Progress stepper */}
        <div className="flex items-center mb-16">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  i < stepIndex ? 'bg-brand-gold text-white' :
                  i === stepIndex ? 'bg-brand-blue dark:bg-brand-beige text-brand-beige dark:text-brand-blue' :
                  'bg-brand-blue/10 dark:bg-white/10 text-brand-blue/30 dark:text-brand-beige/30'
                }`}>
                  {i < stepIndex ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${
                  i === stepIndex ? 'text-brand-blue dark:text-brand-beige' : 'text-brand-blue/30 dark:text-brand-beige/30'
                }`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-4 transition-all ${i < stepIndex ? 'bg-brand-gold' : 'bg-brand-blue/10 dark:bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Shipping */}
          {step === 'Shipping' && (
            <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-4xl font-serif text-brand-blue dark:text-brand-beige mb-2">Delivery Details</h1>
              <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[10px] uppercase tracking-[0.4em] font-black mb-10">Where shall we send your order?</p>
              <form onSubmit={handleShippingSubmit} className="space-y-5">
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text', icon: null, placeholder: 'Anjali Sharma', required: true },
                  { label: 'Email Address', key: 'email', type: 'email', icon: null, placeholder: 'anjali@example.com', required: true },
                  { label: 'Phone Number', key: 'phone', type: 'tel', icon: null, placeholder: '+91 98765 43210', required: true },
                  { label: 'Street Address', key: 'address', type: 'text', icon: null, placeholder: '12, Rose Villa, MG Road', required: true },
                  { label: 'City', key: 'city', type: 'text', icon: null, placeholder: 'Mumbai', required: true },
                  { label: 'State', key: 'state', type: 'text', icon: null, placeholder: 'Maharashtra', required: true },
                  { label: 'PIN Code', key: 'pincode', type: 'text', icon: null, placeholder: '400001', required: true },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-blue/50 dark:text-brand-beige/50 block mb-2">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={shipping[field.key as keyof ShippingInfo] as string}
                      onChange={e => setShipping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-5 py-4 text-sm text-brand-blue dark:text-brand-beige placeholder-brand-blue/20 dark:placeholder-brand-beige/20 focus:outline-none focus:border-brand-gold transition-colors rounded-sm font-medium"
                    />
                  </div>
                ))}
                <button type="submit" className="w-full bg-brand-gold text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all mt-4 flex items-center justify-center gap-2 shadow-xl rounded-sm">
                  Continue to Review <ChevronRight size={14} />
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Review */}
          {step === 'Review' && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-4xl font-serif text-brand-blue dark:text-brand-beige mb-2">Order Review</h1>
              <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[10px] uppercase tracking-[0.4em] font-black mb-10">Confirm your selection</p>

              {/* Items */}
              <div className="space-y-6 mb-8">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-5 bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 p-5 rounded-sm">
                    <div className="relative w-20 h-28 shrink-0 rounded-sm overflow-hidden">
                      <Image src={item.image} fill sizes="80px" className="object-cover" alt={item.name} />
                    </div>
                    <div className="flex-1 py-1">
                      <h4 className="font-serif text-brand-blue dark:text-brand-beige text-lg">{item.name}</h4>
                      <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] uppercase tracking-widest font-bold mt-1">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                        {item.size && <span className="ml-3 text-brand-gold">Size: {item.size}</span>}
                      </p>
                      <p className="font-serif text-brand-blue dark:text-brand-beige mt-2 text-xl">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Summary */}
              <div className="bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 p-6 rounded-sm mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-brand-gold" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-blue/50 dark:text-brand-beige/50">Delivery To</span>
                </div>
                <p className="text-brand-blue dark:text-brand-beige font-medium">{shipping.fullName}</p>
                <p className="text-brand-blue/60 dark:text-brand-beige/60 text-sm mt-1">{shipping.address}, {shipping.city}, {shipping.state} — {shipping.pincode}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Phone size={12} className="text-brand-blue/40 dark:text-brand-beige/40" />
                  <p className="text-brand-blue/60 dark:text-brand-beige/60 text-sm">{shipping.phone}</p>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-3 py-6 border-t border-brand-blue/10 dark:border-white/10 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] uppercase tracking-[0.4em] font-black">Subtotal</span>
                  <span className="text-brand-blue dark:text-brand-beige font-serif">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] uppercase tracking-[0.4em] font-black">GST ({totals.gstRate}%)</span>
                  <span className="text-brand-blue dark:text-brand-beige font-serif">₹{totals.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-blue/40 dark:text-brand-beige/40 text-[9px] uppercase tracking-[0.4em] font-black">Shipping</span>
                  <span className="text-brand-blue dark:text-brand-beige font-serif">
                    {totals.shippingFee === 0 ? <span className="text-brand-gold italic">Free</span> : `₹${totals.shippingFee}`}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-5 border-t border-brand-blue/10 dark:border-white/10 mb-8">
                <span className="text-brand-blue/50 dark:text-brand-beige/50 text-[10px] uppercase tracking-[0.4em] font-black">Total</span>
                <span className="text-3xl font-serif text-brand-blue dark:text-brand-beige">₹{totals.total.toLocaleString('en-IN')}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="mb-8">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-blue/50 dark:text-brand-beige/50 mb-4">Payment Method</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className={`flex-1 border p-4 cursor-pointer transition-colors rounded-sm ${paymentMethod === 'online' ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-blue/10 dark:border-white/10 hover:border-brand-blue/30 dark:hover:border-white/30'}`}>
                    <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="hidden" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-brand-gold' : 'border-brand-blue/30'}`}>
                        {paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
                      </div>
                      <span className="font-serif text-brand-blue dark:text-brand-beige text-lg">Pay Online</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40 ml-7">Cards, UPI & Google Pay</p>
                  </label>
                  
                  <label className={`flex-1 border p-4 cursor-pointer transition-colors rounded-sm ${paymentMethod === 'upi' ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-blue/10 dark:border-white/10 hover:border-brand-blue/30 dark:hover:border-white/30'}`}>
                    <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="hidden" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'upi' ? 'border-brand-gold' : 'border-brand-blue/30'}`}>
                        {paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
                      </div>
                      <span className="font-serif text-brand-blue dark:text-brand-beige text-lg">Google Pay / UPI</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40 ml-7">Direct Deep Link or QR</p>
                  </label>

                  <label className={`flex-1 border p-4 cursor-pointer transition-colors rounded-sm ${paymentMethod === 'cod' ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-blue/10 dark:border-white/10 hover:border-brand-blue/30 dark:hover:border-white/30'}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-brand-gold' : 'border-brand-blue/30'}`}>
                        {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
                      </div>
                      <span className="font-serif text-brand-blue dark:text-brand-beige text-lg">Cash on Delivery</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40 ml-7">Pay when you receive</p>
                  </label>
                </div>
              </div>

              <div className="w-full mt-4 flex flex-col items-center gap-3">
                <button 
                  onClick={paymentMethod === 'online' ? handlePayment : paymentMethod === 'upi' ? handleGPay : handleCOD}
                  className="w-full bg-brand-gold text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all flex items-center justify-center gap-2 shadow-xl rounded-sm"
                >
                  {paymentMethod === 'online' ? (
                    <>Pay Securely <Lock size={14} /></>
                  ) : paymentMethod === 'upi' ? (
                    <>{isMobile ? 'Pay with Google Pay' : 'Pay via UPI QR'} <Smartphone size={14} /></>
                  ) : (
                    <>Place Order (COD) <Package size={14} /></>
                  )}
                </button>
                {paymentMethod === 'online' && (
                  <p className="text-brand-blue/50 dark:text-brand-beige/50 text-[9px] uppercase tracking-widest font-bold flex items-center gap-2">
                    <CreditCard size={12} /> Cards, Google Pay & UPI Accepted
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: UPI Verification Step */}
          {step === 'UPI_Verification' && (
            <motion.div key="upi-verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 p-10 rounded-sm text-center">
              <h2 className="text-3xl font-serif text-brand-blue dark:text-brand-beige mb-4">Complete Payment</h2>
              
              {!isMobile && (
                <div className="mb-8">
                  <p className="text-[10px] uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40 mb-4">Scan QR code with any UPI App</p>
                  <div className="bg-white p-4 inline-block rounded-lg shadow-inner">
                    <img 
                      src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(`upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi'}&pn=Navanika%20Heritage&am=${totals.total}&cu=INR`)}`} 
                      alt="UPI QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {isMobile && (
                <div className="mb-8">
                  <p className="text-brand-blue/60 dark:text-brand-beige/60 text-sm mb-4">Opening Google Pay...</p>
                  <button 
                    onClick={() => window.location.href = `upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi'}&pn=Navanika%20Heritage&am=${totals.total}&cu=INR`}
                    className="text-brand-gold text-xs font-bold uppercase tracking-widest underline"
                  >
                    Click here if GPay didn't open
                  </button>
                </div>
              )}

              <div className="max-w-xs mx-auto text-left">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-blue/50 dark:text-brand-beige/50 block mb-3">Enter Transaction ID / UTR</label>
                <input
                  type="text"
                  placeholder="12 digit number from GPay"
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  className="w-full bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-5 py-4 text-sm text-brand-blue dark:text-brand-beige placeholder-brand-blue/20 dark:placeholder-brand-beige/20 focus:outline-none focus:border-brand-gold transition-colors rounded-sm font-medium mb-6"
                />
                
                <button 
                  onClick={handleUPIOrder}
                  disabled={paying}
                  className="w-full bg-brand-gold text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all flex items-center justify-center gap-2 shadow-xl rounded-sm disabled:opacity-50"
                >
                  {paying ? 'Verifying...' : 'Confirm Payment'}
                </button>
                
                <button 
                  onClick={() => setStep('Review')}
                  className="w-full mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-brand-blue/30 dark:text-brand-beige/30 hover:text-red-500 transition-colors"
                >
                  Cancel & Change Method
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Payment Loading State */}
          {step === 'Payment' && (
            <motion.div key="payment-wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[10px] uppercase tracking-widest font-black">Loading payment gateway...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
