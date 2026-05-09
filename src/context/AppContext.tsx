"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product } from '../data/products';

interface AppContextType {
  user: User | null;
  userData: any | null;
  cart: any[];
  wishlist: any[];
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
  selectedProductForStudio: any;
  setSelectedProductForStudio: (product: any) => void;
  addToCart: (product: Product, size?: string) => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [isModelingStudioOpen, setIsModelingStudioOpen] = useState(false);
  const [selectedProductForStudio, setSelectedProductForStudio] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

  useEffect(() => {
    // Initial theme setup: check localStorage first, then fallback to false
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('navanika-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      } else if (savedTheme === 'light') {
        setIsDarkMode(false);
      } else {
        // Default to light if no preference
        setIsDarkMode(false);
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
            const newUserData = {
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
            const existingData = userSnap.data();
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
          setCart(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        unsubs.push(unsubCart);

        const wishlistQuery = query(collection(db, 'users', user.uid, 'wishlist'));
        const unsubWishlist = onSnapshot(wishlistQuery, (snapshot) => {
          setWishlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    if (!user) { setIsAuthOpen(true); return; }
    const cartItemId = size ? `${product.id}_${size}` : product.id;
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
    setIsCartOpen(true);
  };

  const toggleWishlist = async (product: Product) => {
    if (!user) { setIsAuthOpen(true); return; }
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
