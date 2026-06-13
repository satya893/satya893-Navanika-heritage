"use client";

import React from 'react';
import { Home, LayoutGrid, Package, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount } = useApp();

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Categories', icon: LayoutGrid, path: '/categories' },
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Orders', icon: Package, path: '/orders' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-beige/80 dark:bg-brand-blue/80 backdrop-blur-lg border-t border-brand-blue/5 dark:border-brand-beige/5 z-[100] pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300 ${
                isActive ? 'text-brand-gold' : 'text-brand-blue/60 dark:text-brand-beige/60'
              }`}
            >
              <Icon size={20} className={isActive ? 'scale-110' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
