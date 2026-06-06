"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product } from '../data/products';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size: string | null;
  addedAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}

export interface UserAddress {
  id: string;
  label: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface UserSession {
  id: string;
  deviceName: string;
  lastActive: string;
}

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'user' | 'moderator';
  createdAt: string;
  walletBalance?: number;
  addresses?: UserAddress[];
  sessions?: UserSession[];
}

interface AppContextType {
  user: User | null;
  userData: UserData | null;
  cart: CartItem[];
  wishlist: WishlistItem[];
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isGenOpen: boolean;
  setIsGenOpen: (open: boolean) => void;
  isModelingStudioOpen: boolean;
  setIsModelingStudioOpen: (open: boolean) => void;
  selectedProductForStudio: Product | null;
  setSelectedProductForStudio: (product: Product | null) => void;
  addToCart: (product: Product, size?: string) => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [isModelingStudioOpen, setIsModelingStudioOpen] = useState(false);
  const [selectedProductForStudio, setSelectedProductForStudio] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

  useEffect(() => {
    // Initial theme and guest data setup
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('navanika-theme');
      if (savedTheme === 'dark') setIsDarkMode(true);
      else if (savedTheme === 'light') setIsDarkMode(false);
      
      // Load guest data if no user is initially detected
      if (!auth.currentUser) {
        const savedWishlist = localStorage.getItem('navanika-wishlist');
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
        
        const savedCart = localStorage.getItem('navanika-cart');
        if (savedCart) setCart(JSON.parse(savedCart));
      }
    }
  }, []);


  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clear previous listeners
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      setUser(user);
      if (user) {
        const email = user.email?.toLowerCase() || '';
        const shouldBeAdmin = adminEmails.includes(email);
        const userRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userRef, async (userSnap) => {
          if (!userSnap.exists()) {
            const newUserData: UserData = {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              role: shouldBeAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
          } else {
            const existingData = userSnap.data() as UserData;
            if (shouldBeAdmin && existingData.role !== 'admin') {
              await setDoc(userRef, { role: 'admin' }, { merge: true });
              existingData.role = 'admin';
            }
            setUserData(existingData);
          }
        });
        unsubs.push(unsubUser);

        const cartQuery = query(collection(db, 'users', user.uid, 'cart'));
        const unsubCart = onSnapshot(cartQuery, (snapshot) => {
          setCart(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem)));
        });
        unsubs.push(unsubCart);

        const wishlistQuery = query(collection(db, 'users', user.uid, 'wishlist'));
        const unsubWishlist = onSnapshot(wishlistQuery, (snapshot) => {
          setWishlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WishlistItem)));
        });
        unsubs.push(unsubWishlist);
      } else {
        setUserData(null);
        setCart([]);
        setWishlist([]);
      }
    });
    return () => {
      unsubscribe();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const addToCart = async (product: Product, size?: string) => {
    const cartItemId = size ? `${product.id}_${size}` : product.id;
    
    if (user) {
      const cartRef = doc(db, 'users', user.uid, 'cart', cartItemId);
      const cartSnap = await getDoc(cartRef);
      if (cartSnap.exists()) {
        await setDoc(cartRef, { ...cartSnap.data(), quantity: cartSnap.data().quantity + 1 }, { merge: true });
      } else {
        await setDoc(cartRef, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          size: size || null,
          addedAt: new Date().toISOString()
        });
      }
    } else {
      // Handle Guest Cart
      const newCart = [...cart];
      const existingItem = newCart.find(item => item.id === cartItemId);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        newCart.push({
          id: cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          size: size || null,
          addedAt: new Date().toISOString()
        });
      }
      setCart(newCart);
      localStorage.setItem('navanika-cart', JSON.stringify(newCart));
    }
    setIsCartOpen(true);
  };


  const toggleWishlist = async (product: Product) => {
    if (user) {
      const wishlistRef = doc(db, 'users', user.uid, 'wishlist', product.id);
      const wishlistSnap = await getDoc(wishlistRef);
      if (wishlistSnap.exists()) {
        await deleteDoc(wishlistRef);
      } else {
        await setDoc(wishlistRef, {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          addedAt: new Date().toISOString()
        });
      }
    } else {
      // Handle Guest Wishlist
      const newWishlist = [...wishlist];
      const index = newWishlist.findIndex(item => item.id === product.id || item.productId === product.id);
      if (index > -1) {
        newWishlist.splice(index, 1);
      } else {
        newWishlist.push({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          addedAt: new Date().toISOString()
        });
      }
      setWishlist(newWishlist);
      localStorage.setItem('navanika-wishlist', JSON.stringify(newWishlist));
    }
  };


  return (
    <AppContext.Provider value={{
      user, userData, cart, wishlist,
      isAuthOpen, setIsAuthOpen,
      isCartOpen, setIsCartOpen,
      isWishlistOpen, setIsWishlistOpen,
      isChatOpen, setIsChatOpen,
      isGenOpen, setIsGenOpen,
      isModelingStudioOpen, setIsModelingStudioOpen,
      selectedProductForStudio, setSelectedProductForStudio,
      addToCart, toggleWishlist,
      isDarkMode, toggleDarkMode: () => {
        const nextMode = !isDarkMode;
        setIsDarkMode(nextMode);
        localStorage.setItem('navanika-theme', nextMode ? 'dark' : 'light');
      }
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
