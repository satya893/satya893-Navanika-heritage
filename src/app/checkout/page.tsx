"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, CheckCircle, CreditCard, Lock, ChevronRight, ArrowLeft, Package, Smartphone, X, Loader2 } from 'lucide-react';
import { ShippingInfo, OrderItem } from '../../lib/orders';
import { toast } from 'sonner';

import { useApp } from '../../context/AppContext';


const STEPS = ['Shipping', 'Review', 'Payment'] as const;
type Step = typeof STEPS[number] | 'UPI_Verification';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, userData, cart, cartTotal, setIsAuthOpen } = useApp();
  
  const [step, setStep] = useState<Step>('Shipping');
  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: '', email: '', phone: '', address: '', city: '', state: '', pincode: ''
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [useWallet, setUseWallet] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const savedAddresses = userData?.addresses || [];
  const walletBalance = userData?.walletBalance || 0;

  useEffect(() => {
    if (savedAddresses.length > 0) {
      const defaultAddress = savedAddresses[0];
      setShipping(defaultAddress);
      setSelectedAddressId(defaultAddress.id);
      setShowAddressForm(false);
    }
  }, [userData]);
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

  const walletCredit = useWallet ? Math.min(walletBalance, totals.total) : 0;
  const remainingTotal = totals.total - walletCredit;

  const subtotal = cartTotal;
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

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showAddressForm && saveAddress && user) {
      try {
        const newAddress = {
          ...shipping,
          id: `addr_${Date.now()}`,
          label: addressLabel,
        };
        const updatedAddresses = [...savedAddresses, newAddress];
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../../firebase');
        await setDoc(doc(db, 'users', user.uid), { addresses: updatedAddresses }, { merge: true });
      } catch (err) {
        console.error("Failed to save address", err);
      }
    }
    
    setStep('Review');
  };

  const handleSelectAddress = (addr: any) => {
    setShipping(addr);
    setSelectedAddressId(addr.id);
    setShowAddressForm(false);
  };

  const handleDeleteAddress = async (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      const updatedAddresses = savedAddresses.filter((a: any) => a.id !== addressId);
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      await setDoc(doc(db, 'users', user.uid), { addresses: updatedAddresses }, { merge: true });
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
        setShowAddressForm(true);
      }
    } catch (err) {
      console.error("Failed to delete address", err);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data);
        toast.success(`Coupon applied! You got ${data.discount}% off.`);
      } else {
        toast.error(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
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
          walletUsed: walletCredit,
          couponCode: appliedCoupon?.code
        }),
      });

      console.log('🔵 Place order response status:', res.status);
      const data = await res.json();
      console.log('🔵 Place order response:', data);

      if (!res.ok) {
        const errorMsg = data?.error || 'Error processing your COD order';
        console.error('❌ Order placement failed:', errorMsg);
        toast.error(errorMsg);
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
      toast.error("Error processing your COD order: " + errorMsg);
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
      toast.error("Please enter the Transaction ID / UTR provided by GPay");
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
          walletUsed: walletCredit,
          couponCode: appliedCoupon?.code
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Error placing your order');
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
      toast.error("Error processing UPI order");
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
                  walletUsed: walletCredit,
                  couponCode: appliedCoupon?.code
                }),
              });

              const data = await res.json();
              if (!res.ok) {
                toast.error(data?.error || 'Error placing your order');
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
              toast.error("Payment verification failed!");
              setStep('Review');
              setPaying(false);
            }
          } catch (err) {
            console.error("Verification error", err);
            toast.error("Error verifying payment");
            setStep('Review');
            setPaying(false);
          }
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        console.error("Payment Failed", response.error);
        toast.error(response.error.description || "Payment failed");
        setStep('Review');
        setPaying(false);
      });
      
      rzp1.open();

    } catch (err) {
      console.error(err);
      toast.error("Error initiating payment");
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

              {/* Saved Addresses List */}
              {savedAddresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {savedAddresses.map((addr: any) => (
                    <div 
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`relative p-5 border cursor-pointer transition-all rounded-sm group/addr ${selectedAddressId === addr.id && !showAddressForm ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-blue/10 dark:border-white/10 hover:border-brand-blue/30'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-brand-gold text-white px-2 py-0.5 rounded-full">{addr.label}</span>
                          {selectedAddressId === addr.id && !showAddressForm && <CheckCircle size={14} className="text-brand-gold" />}
                        </div>
                        <button 
                          onClick={(e) => handleDeleteAddress(e, addr.id)}
                          className="opacity-0 group-hover/addr:opacity-40 hover:!opacity-100 transition-opacity p-1"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-brand-blue dark:text-brand-beige">{addr.fullName}</p>
                      <p className="text-[10px] text-brand-blue/60 dark:text-brand-beige/60 mt-1 leading-relaxed line-clamp-2">{addr.address}, {addr.city}</p>
                    </div>
                  ))}
                  <div 
                    onClick={() => { setShowAddressForm(true); setSelectedAddressId(null); }}
                    className={`flex flex-col items-center justify-center p-5 border border-dashed cursor-pointer transition-all rounded-sm hover:border-brand-gold hover:bg-brand-gold/5 ${showAddressForm ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-blue/20 dark:border-white/20'}`}
                  >
                    <Package size={20} className="text-brand-gold mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-blue/60 dark:text-brand-beige/60">Add New Address</span>
                  </div>
                </div>
              )}

              {showAddressForm && (
                <form onSubmit={handleShippingSubmit} className="space-y-6 bg-white dark:bg-white/5 p-8 rounded-sm border border-brand-blue/5 dark:border-white/10 shadow-sm">
                  <div className="flex gap-4 mb-4">
                    {(['Home', 'Work', 'Other'] as const).map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setAddressLabel(l)}
                        className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest border transition-all rounded-sm ${addressLabel === l ? 'bg-brand-gold text-white border-brand-gold' : 'border-brand-blue/10 dark:border-white/10 text-brand-blue/40 dark:text-brand-beige/40'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'Anjali Sharma', colSpan: 2 },
                      { label: 'Email Address', key: 'email', type: 'email', placeholder: 'anjali@example.com' },
                      { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                      { label: 'Street Address', key: 'address', type: 'text', placeholder: '12, Rose Villa, MG Road', colSpan: 2 },
                      { label: 'City', key: 'city', type: 'text', placeholder: 'Mumbai' },
                      { label: 'State', key: 'state', type: 'text', placeholder: 'Maharashtra' },
                      { label: 'PIN Code', key: 'pincode', type: 'text', placeholder: '400001' },
                    ].map(field => (
                      <div key={field.key} className={field.colSpan === 2 ? 'md:col-span-2' : ''}>
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-blue/50 dark:text-brand-beige/50 block mb-2">{field.label}</label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          required
                          value={shipping[field.key as keyof ShippingInfo] as string}
                          onChange={e => setShipping(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 px-5 py-4 text-sm text-brand-blue dark:text-brand-beige placeholder-brand-blue/20 dark:placeholder-brand-beige/20 focus:outline-none focus:border-brand-gold transition-colors rounded-sm font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group py-2">
                    <input 
                      type="checkbox" 
                      checked={saveAddress} 
                      onChange={e => setSaveAddress(e.target.checked)}
                      className="w-4 h-4 rounded border-brand-blue/20 text-brand-gold focus:ring-brand-gold"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue/40 dark:text-brand-beige/40 group-hover:text-brand-blue dark:group-hover:text-brand-beige transition-colors">Save this address for future checkouts</span>
                  </label>

                  <button type="submit" className="w-full bg-brand-gold text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all mt-4 flex items-center justify-center gap-2 shadow-xl rounded-sm">
                    Confirm Delivery Details <ChevronRight size={14} />
                  </button>
                </form>
              )}

              {!showAddressForm && (
                <button 
                  onClick={handleShippingSubmit}
                  className="w-full bg-brand-gold text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all mt-8 flex items-center justify-center gap-2 shadow-xl rounded-sm"
                >
                  Deliver to this Address <ChevronRight size={14} />
                </button>
              )}
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
              {/* Coupon Section */}
            <div className="bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-6 mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-4 flex items-center gap-2">
                <Smartphone size={14} /> Have a coupon?
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter Code (e.g. NAV20)" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-brand-blue/5 dark:bg-black/20 border border-brand-blue/10 dark:border-white/10 px-4 py-3 text-xs text-brand-blue dark:text-brand-beige rounded-sm outline-none focus:border-brand-gold"
                />
                <button 
                  onClick={handleValidateCoupon}
                  disabled={isValidatingCoupon || !couponCode}
                  className="bg-brand-blue text-white px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-brand-gold transition-colors rounded-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isValidatingCoupon ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-3 flex items-center justify-between bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-sm">
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                    Coupon Applied: {appliedCoupon.code} ({appliedCoupon.discount}% OFF)
                  </p>
                  <button onClick={() => setAppliedCoupon(null)} className="text-green-500 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-white/5 border border-brand-blue/5 dark:border-white/10 rounded-sm p-8">
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
                {/* Totals */}
                <div className="space-y-3 pt-4 border-t border-brand-blue/10 dark:border-white/10">
                  <div className="flex justify-between text-xs text-brand-blue/60 dark:text-brand-beige/60">
                    <span className="uppercase tracking-widest font-black">Subtotal</span>
                    <span className="font-serif">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs text-green-500">
                      <span className="uppercase tracking-widest font-black">Coupon Discount ({appliedCoupon.discount}%)</span>
                      <span className="font-serif">-₹{Math.round((totals.subtotal * appliedCoupon.discount) / 100).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-brand-blue/60 dark:text-brand-beige/60">
                    <span className="uppercase tracking-widest font-black">Tax (GST {totals.gstRate}%)</span>
                    <span className="font-serif">₹{Math.round((totals.subtotal - (appliedCoupon ? (totals.subtotal * appliedCoupon.discount / 100) : 0)) * totals.gstRate / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-brand-blue/60 dark:text-brand-beige/60">
                    <span className="uppercase tracking-widest font-black">Shipping Fee</span>
                    <span className="font-serif">₹{totals.shippingFee === 0 ? 'FREE' : totals.shippingFee.toLocaleString()}</span>
                  </div>
                  
                  {useWallet && (
                    <div className="flex justify-between text-xs text-brand-gold">
                      <span className="uppercase tracking-widest font-black">Wallet Credit</span>
                      <span className="font-serif">-₹{walletCredit.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg text-brand-blue dark:text-brand-beige pt-4 border-t border-brand-blue/10 dark:border-white/10">
                    <span className="font-black uppercase tracking-[0.2em]">Total</span>
                    <span className="font-serif font-bold text-brand-gold">
                      ₹{Math.max(0, (totals.subtotal - (appliedCoupon ? Math.round(totals.subtotal * appliedCoupon.discount / 100) : 0)) + Math.round((totals.subtotal - (appliedCoupon ? (totals.subtotal * appliedCoupon.discount / 100) : 0)) * totals.gstRate / 100) + totals.shippingFee - walletCredit).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Totals Breakdown */}
              {/* Wallet Integration */}
              {walletBalance > 0 && (
                <div className="p-6 bg-brand-gold/5 border border-brand-gold/20 rounded-sm mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="useWallet"
                      checked={useWallet} 
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="w-4 h-4 rounded border-brand-gold text-brand-gold focus:ring-brand-gold cursor-pointer"
                    />
                    <label htmlFor="useWallet" className="cursor-pointer">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue dark:text-brand-beige">Use Navanika Wallet</p>
                      <p className="text-[8px] text-brand-blue/40 dark:text-brand-beige/40 uppercase tracking-widest">Available Balance: ₹{walletBalance.toLocaleString()}</p>
                    </label>
                  </div>
                  {useWallet && <span className="text-brand-gold font-serif text-lg">-₹{walletCredit.toLocaleString()}</span>}
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center py-5 border-t border-brand-blue/10 dark:border-white/10 mb-8">
                <span className="text-brand-blue/50 dark:text-brand-beige/50 text-[10px] uppercase tracking-[0.4em] font-black">
                  {useWallet ? 'Amount to Pay' : 'Total'}
                </span>
                <span className="text-3xl font-serif text-brand-blue dark:text-brand-beige">₹{remainingTotal.toLocaleString('en-IN')}</span>
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
                {remainingTotal === 0 ? (
                  <button 
                    onClick={() => handleCOD()}
                    disabled={paying}
                    className="w-full bg-brand-gold text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue transition-all shadow-xl rounded-sm disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {paying ? <Loader2 size={14} className="animate-spin" /> : <>Confirm Order with Wallet <ChevronRight size={14} /></>}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={paymentMethod === 'online' ? handlePayment : paymentMethod === 'upi' ? handleGPay : handleCOD}
                      disabled={paying}
                      className="w-full bg-brand-gold text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:text-white dark:hover:text-brand-blue transition-all flex items-center justify-center gap-2 shadow-xl rounded-sm disabled:opacity-70"
                    >
                      {paying ? <Loader2 size={14} className="animate-spin" /> : paymentMethod === 'online' ? (
                        <>Pay ₹{remainingTotal.toLocaleString()} Securely <Lock size={14} /></>
                      ) : paymentMethod === 'upi' ? (
                        <>{isMobile ? `Pay ₹${remainingTotal.toLocaleString()} with GPay` : `Pay ₹${remainingTotal.toLocaleString()} via UPI QR`} <Smartphone size={14} /></>
                      ) : (
                        <>Place Order ₹{remainingTotal.toLocaleString()} (COD) <Package size={14} /></>
                      )}
                    </button>
                    {paymentMethod === 'online' && (
                      <p className="text-brand-blue/50 dark:text-brand-beige/50 text-[9px] uppercase tracking-widest font-bold flex items-center gap-2">
                        <CreditCard size={12} /> Cards, Google Pay & UPI Accepted
                      </p>
                    )}
                  </>
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
