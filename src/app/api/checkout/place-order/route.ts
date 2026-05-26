import { NextResponse } from 'next/server';
import { dbAdmin, sendAdminNotificationServer } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type ShippingInfo = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, items, shipping, paymentId, paymentMethod, walletUsed = 0, couponCode } = body as {
      userId: string;
      items: OrderItem[];
      shipping: ShippingInfo;
      paymentId: string;
      paymentMethod: 'online' | 'cod' | 'upi';
      walletUsed?: number;
      couponCode?: string;
    };

    if (!userId || !Array.isArray(items) || items.length === 0) {
      console.error('❌ [place-order] Invalid request - missing userId or items');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Transaction: decrement stock + create order atomically
    const orderRef = dbAdmin.collection('orders').doc();
    const userRef = dbAdmin.collection('users').doc(userId);

    const stockUpdates: any[] = [];
    let couponDiscountAmount = 0;
    let appliedCouponData: any = null;

    await dbAdmin.runTransaction(async (tx) => {
      // 1) Read all product documents AND user document AND coupon first
      const productRefs = items.map(item => dbAdmin.collection('products').doc(item.productId));
      const productSnaps = await Promise.all(productRefs.map(ref => tx.get(ref)));
      const userSnap = await tx.get(userRef);

      // Verify coupon if provided
      if (couponCode) {
        const couponRef = dbAdmin.collection('coupons').doc(couponCode.toUpperCase());
        const couponSnap = await tx.get(couponRef);
        if (couponSnap.exists && couponSnap.data()?.isActive) {
          appliedCouponData = couponSnap.data();
        }
      }

      // 2) Verify wallet balance if used
      if (walletUsed > 0) {
        if (!userSnap.exists) throw new Error('User not found');
        const userData = userSnap.data();
        const currentBalance = userData?.walletBalance || 0;
        if (currentBalance < walletUsed) {
          throw new Error('Insufficient wallet balance');
        }
      }

      // 3) Verify stock and prepare updates
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const qty = Number(item.quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error('Invalid quantity');
        }

        const productSnap = productSnaps[i];
        if (!productSnap.exists) {
          console.error('❌ [place-order] Product not found:', item.productId);
          throw new Error(`Product not found: ${item.productId}`);
        }

        const product = productSnap.data() as any;
        const currentStock = Number(product.stock ?? 100);

        if (currentStock < qty) {
          console.error(`❌ [place-order] Insufficient stock for ${item.productId}`);
          throw new Error(`Insufficient stock for ${item.productId}`);
        }

        stockUpdates.push({ ref: productRefs[i], newStock: currentStock - qty });
      }

      // 4) Perform all writes
      for (const update of stockUpdates) {
        tx.update(update.ref, { stock: update.newStock });
      }

      // Deduct wallet balance
      if (walletUsed > 0) {
        tx.update(userRef, { 
          walletBalance: FieldValue.increment(-walletUsed) 
        });
      }

      // 5) Create order with Tax, Shipping and Coupon
      const subtotal = items.reduce((acc, item) => acc + Number(item.price) * Number(item.quantity), 0);
      
      // Calculate Coupon Discount
      if (appliedCouponData) {
        couponDiscountAmount = Math.round((subtotal * appliedCouponData.discount) / 100);
      }

      const discountedSubtotal = subtotal - couponDiscountAmount;
      const tax = discountedSubtotal * 0.05; // 5% GST
      
      let shippingFee = 99;
      const pinPrefix = shipping.pincode.substring(0, 2);
      if (['40'].includes(pinPrefix)) shippingFee = 40;
      else if (['41', '42', '43', '44'].includes(pinPrefix)) shippingFee = 65;
      
      if (subtotal > 5000) shippingFee = 0; // Free shipping threshold

      const finalTotal = discountedSubtotal + tax + shippingFee;
      const paidAmount = finalTotal - walletUsed;
      
      // If fully paid by wallet, status is confirmed. 
      // Otherwise, depend on payment method.
      const status = paidAmount <= 0 ? 'confirmed' :
                     paymentMethod === 'cod' ? 'confirmed' : 
                     paymentMethod === 'upi' ? 'pending_verification' : 'pending';

      tx.set(orderRef, {
        id: orderRef.id,
        userId,
        items,
        subtotal,
        discount: couponDiscountAmount,
        couponCode: couponCode || null,
        tax,
        shippingFee,
        total: finalTotal,
        walletUsed,
        paidAmount: Math.max(0, paidAmount),
        shipping,
        paymentId,
        paymentMethod,
        status,
        createdAt: new Date().toISOString(),
      });
    });

    // Notify Admin of New Order
    await sendAdminNotificationServer({
      title: 'New Order Received',
      message: `A new order #${orderRef.id.toUpperCase()} has been placed by ${shipping.fullName}.`,
      type: 'order',
      orderId: orderRef.id
    });

    // Notify User of Order Confirmation
    await dbAdmin.collection('users').doc(userId).collection('notifications').add({
      title: 'Order Placed Successfully',
      message: `Your order #${orderRef.id.toUpperCase()} has been received and is being processed.`,
      type: 'order',
      isRead: false,
      link: `/order/${orderRef.id}`,
      createdAt: new Date().toISOString()
    });

    // 5) Check for low stock and notify admin (Asynchronous)
    const lowStockItems = items.filter(item => {
      const update = stockUpdates.find(u => u.ref.id === item.productId);
      return update && update.newStock < 5;
    });

    if (lowStockItems.length > 0) {
      // Notify admin (fire and forget for this request)
      Promise.all(lowStockItems.map(item => {
        const update = stockUpdates.find(u => u.ref.id === item.productId);
        
        // Notify Admin via In-App
        sendAdminNotificationServer({
          title: 'Low Stock Alert',
          message: `Product "${item.name}" is running low (${update?.newStock} remaining).`,
          type: 'product'
        });

        return fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'low_stock',
            productName: item.name,
            stockCount: update?.newStock,
            email: process.env.EMAIL_USER // Notify the admin
          })
        }).catch(e => console.error('Failed to send low stock alert', e));
      }));
    }

    return NextResponse.json({ orderId: orderRef.id });
  } catch (err: any) {
    console.error('❌ [place-order] Error:', err);
    const msg = String(err?.message || err);

    if (msg.includes('Insufficient stock')) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    return NextResponse.json({ error: msg || 'Order placement failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
