import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string | null;
}

export interface Order {
  id?: string;
  userId: string;
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  shippingFee?: number;
  total: number;
  shipping: ShippingInfo;
  paymentId: string;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'exchanged' | 'cancellation_pending';
  createdAt: any;
  cancellationRequest?: {
    reason: string;
    type: 'refund' | 'exchange';
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
  };
  returnRequest?: {
    type: 'return' | 'exchange';
    reason: string;
    details: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
  };
}

export const createOrder = async (
  userId: string,
  items: OrderItem[],
  shipping: ShippingInfo,
  paymentId: string
): Promise<string> => {
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const orderRef = await addDoc(collection(db, 'orders'), {
    userId,
    items,
    total,
    shipping,
    paymentId,
    status: 'confirmed',
    createdAt: serverTimestamp(),
  });
  return orderRef.id;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const clearUserCart = async (userId: string, cartItems: any[]) => {
  const deletePromises = cartItems.map(item =>
    deleteDoc(doc(db, 'users', userId, 'cart', item.id))
  );
  await Promise.all(deletePromises);
};
