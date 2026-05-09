import React, { useState } from 'react';
import { ShoppingBag, Heart, User, LogOut, Menu, Sun, Moon, X } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isAdmin?: boolean;
}

export default function Navbar({ 
  user, 
  onLogin, 
  onLogout, 
  cartCount, 
  wishlistCount, 
  onOpenCart, 
  onOpenWishlist,
  isDarkMode,
  toggleDarkMode,
  isAdmin
}: NavbarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className={`fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-brand-blue/95 border-brand-beige/10' : 'bg-brand-beige/95 border-brand-blue/10'} backdrop-blur-md z-50 border-b transition-colors duration-300`}>
      {/* Heritage Pattern Overlay */}
      <div 
        className={`absolute inset-0 z-0 ${isDarkMode ? 'opacity-20' : 'opacity-30'} pointer-events-none bg-[url('/mandala.png')] bg-repeat`}
        style={{ backgroundSize: '450px auto' }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between relative z-10">
        <div className="flex items-center lg:hidden w-1/3">
          <button onClick={() => setIsMobileMenuOpen(true)} className={`p-2 -ml-2 ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'}`}>
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center justify-center lg:justify-start gap-4 cursor-pointer absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 w-max" onClick={() => router.push('/')}>
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-[3px] border-[#C5A059] shadow-lg bg-[#0A1128] flex items-center justify-center shrink-0">
            <Image 
              src="/logo.png" 
              alt="Navanika Logo" 
              fill
              sizes="(max-width: 768px) 56px, 64px"
              className="object-contain p-1"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className={`text-[1.1rem] md:text-2xl font-serif tracking-[0.2em] leading-none ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'} font-bold whitespace-nowrap`}>NAVANIKA</span>
            <span className="text-[5.5px] md:text-[7px] uppercase tracking-[0.4em] mt-1 text-brand-gold font-black whitespace-nowrap">Classic Heritage</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center gap-10 absolute left-1/2 -translate-x-1/2">
          {[
            { name: 'Home', path: '/' },
            { name: 'Sarees', path: '/category/sarees' },
            { name: 'Formal', path: '/category/formal' },
            { name: 'Casual', path: '/category/casual' },
            { name: 'Fashion', path: '/category/fashion' },
            { name: 'Trending', path: '/category/trending' }
          ].map(item => (
            <Link 
              key={item.name} 
              href={item.path}
              className={`text-[9px] uppercase tracking-[0.3em] font-black ${isDarkMode ? 'text-brand-beige/60 hover:text-brand-gold' : 'text-brand-blue/60 hover:text-brand-gold'} transition-all`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4 md:gap-6 w-1/3 lg:w-auto">
          <button 
            onClick={toggleDarkMode}
            className={`hidden md:block p-2 ${isDarkMode ? 'text-brand-beige hover:text-brand-gold' : 'text-brand-blue hover:text-brand-gold'} transition-colors`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={onOpenWishlist} className={`hidden md:block relative ${isDarkMode ? 'text-brand-beige hover:text-brand-gold' : 'text-brand-blue hover:text-brand-gold'} transition-colors`}>
            <Heart size={20} />
            {wishlistCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">{wishlistCount}</span>}
          </button>
          <NotificationBell />
          <button onClick={onOpenCart} className={`relative ${isDarkMode ? 'text-brand-beige hover:text-brand-gold' : 'text-brand-blue hover:text-brand-gold'} transition-all`}>
            <ShoppingBag size={20} className="md:w-6 md:h-6" />
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-brand-gold text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}
          </button>
          
          {user ? (
            <div className="hidden md:flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin" className="text-[10px] uppercase tracking-widest font-black text-brand-gold hover:text-brand-beige border border-brand-gold px-3 py-1 rounded-sm transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/profile">
                <Image 
                  src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                  alt={user.displayName || 'User'} 
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-brand-gold/50 hover:border-brand-gold transition-all" 
                />
              </Link>
              <button onClick={onLogout} className={`${isDarkMode ? 'text-brand-beige/40 hover:text-brand-beige' : 'text-brand-blue/40 hover:text-brand-blue'} transition-colors`}><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={onLogin} className={`hidden md:flex items-center gap-2 text-[9px] uppercase tracking-widest font-black ${isDarkMode ? 'text-brand-beige border-brand-beige/20' : 'text-brand-blue border-brand-blue/20'} px-4 py-2 rounded-sm hover:bg-brand-gold hover:text-brand-blue transition-all`}>
              <User size={14} /> Login
            </button>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className={`fixed inset-0 z-[100] ${isDarkMode ? 'bg-brand-blue' : 'bg-brand-beige'} flex flex-col items-center justify-center gap-8 lg:hidden overflow-y-auto py-20`}>
          <button onClick={() => setIsMobileMenuOpen(false)} className={`absolute top-8 left-6 p-2 ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'}`}>
            <X size={32} />
          </button>
          
          <div className="flex flex-col items-center gap-6 w-full px-10">
            {[
              { name: 'Home', path: '/' },
              { name: 'Sarees', path: '/category/sarees' },
              { name: 'Formal', path: '/category/formal' },
              { name: 'Casual', path: '/category/casual' },
              { name: 'Fashion', path: '/category/fashion' },
              { name: 'Trending', path: '/category/trending' }
            ].map(item => (
              <Link 
                key={item.name} 
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-xl md:text-2xl uppercase tracking-[0.2em] font-serif ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'} hover:text-brand-gold transition-all`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="h-[1px] w-20 bg-brand-gold/30"></div>

          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-8">
              <button onClick={onOpenWishlist} className={`relative ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'}`}>
                <Heart size={24} />
                {wishlistCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{wishlistCount}</span>}
              </button>
              <button onClick={toggleDarkMode} className={isDarkMode ? 'text-brand-beige' : 'text-brand-blue'}>
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>

            {user ? (
              <div className="flex flex-col items-center gap-6">
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[10px] uppercase tracking-widest font-black text-brand-gold border border-brand-gold px-6 py-2 rounded-sm"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link 
                  href="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-sm font-serif text-brand-blue dark:text-brand-beige"
                >
                  <Image 
                    src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                    alt={user.displayName || 'User'} 
                    width={32}
                    height={32}
                    className="rounded-full border border-brand-gold/50" 
                  />
                  <span>My Heritage Profile</span>
                </Link>
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="text-xs uppercase tracking-widest font-black opacity-40">Logout</button>
              </div>
            ) : (
              <button onClick={() => { onLogin(); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 text-xs uppercase tracking-widest font-black ${isDarkMode ? 'text-brand-beige border-brand-beige/20' : 'text-brand-blue border-brand-blue/20'} px-8 py-3 border rounded-sm`}>
                <User size={18} /> Login / Register
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
