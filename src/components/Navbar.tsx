import React, { useState } from 'react';
import { ShoppingBag, Heart, User, LogOut, Menu, Sun, Moon, X, ChevronRight } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
      isScrolled 
        ? `${isDarkMode ? 'bg-brand-blue/80 border-brand-beige/5' : 'bg-brand-beige/80 border-brand-blue/5'} backdrop-blur-xl h-20 shadow-2xl` 
        : `${isDarkMode ? 'bg-brand-blue border-brand-beige/10' : 'bg-brand-beige border-brand-blue/10'} h-28`
    }`}>
      {/* Heritage Pattern Overlay */}
      <div 
        className={`absolute inset-0 z-0 ${isDarkMode ? 'opacity-10' : 'opacity-20'} pointer-events-none bg-[url('/mandala.png')] bg-repeat transition-opacity duration-500 ${isScrolled ? 'opacity-5' : ''}`}
        style={{ backgroundSize: '450px auto' }}
      ></div>

      <div className={`max-w-[1800px] mx-auto px-4 md:px-12 flex items-center relative z-10 transition-all duration-500 h-full`}>

        {/* Left Side: Hamburger (Mobile/Tablet) / Desktop Logo Start */}
        <div className="flex items-center xl:hidden w-1/4">
          <button onClick={() => setIsMobileMenuOpen(true)} className={`p-2 -ml-2 ${isDarkMode ? 'text-brand-beige hover:text-brand-gold' : 'text-brand-blue hover:text-brand-gold'} transition-colors`}>
            <Menu size={22} />
          </button>
        </div>

        {/* Center: Brand Identity */}
        <div className="flex-1 xl:flex-none flex items-center justify-center xl:justify-start gap-2 md:gap-4 cursor-pointer relative z-20" onClick={() => router.push('/')}>
          <div className={`relative rounded-full overflow-hidden border-[2px] md:border-[3px] border-[#C5A059] shadow-lg bg-[#0A1128] flex items-center justify-center shrink-0 transition-all duration-500 ${isScrolled ? 'w-10 h-10 md:w-12 md:h-12 border-2' : 'w-12 h-12 md:w-16 md:h-16'}`}>
            <Image 
              src="/logo.png" 
              alt="Navanika" 
              fill
              sizes="(max-width: 768px) 48px, 64px"
              className="object-contain p-1"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className={`font-serif tracking-[0.2em] leading-none ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'} whitespace-nowrap transition-all duration-500 ${isScrolled ? 'text-xs md:text-lg' : 'text-sm md:text-2xl'}`}>NAVANIKA</span>
            <span className={`uppercase tracking-[0.4em] text-brand-gold font-black whitespace-nowrap transition-all duration-500 ${isScrolled ? 'text-[5px] md:text-[6px] mt-0.5' : 'text-[6px] md:text-[8px] mt-1.5'}`}>Classic Heritage</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden xl:flex items-center justify-center gap-8 flex-1 px-8">
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
              className={`text-[11px] uppercase tracking-[0.3em] font-bold ${isDarkMode ? 'text-brand-beige/60 hover:text-brand-gold' : 'text-brand-blue/60 hover:text-brand-gold'} transition-all duration-300 relative group whitespace-nowrap py-2`}
            >
              {item.name}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-brand-gold transition-all duration-500 group-hover:w-full rounded-full"></span>
            </Link>
          ))}
        </div>

        {/* Right Side: Actions */}
        <div className="flex-1 xl:flex-none flex items-center justify-end gap-2 md:gap-4 xl:gap-10 shrink-0">
          <button 
            onClick={toggleDarkMode}
            className={`hidden md:block p-2 ${isDarkMode ? 'text-brand-beige hover:text-brand-gold' : 'text-brand-blue hover:text-brand-gold'} transition-colors`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={onOpenWishlist} className={`hidden md:block relative p-2 ${isDarkMode ? 'text-brand-beige hover:text-brand-gold' : 'text-brand-blue hover:text-brand-gold'} transition-colors`}>
            <Heart size={20} />
            {wishlistCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">{wishlistCount}</span>}
          </button>
          <NotificationBell />
          <button onClick={onOpenCart} className={`relative p-2 ${isDarkMode ? 'text-brand-beige hover:text-brand-gold' : 'text-brand-blue hover:text-brand-gold'} transition-all`}>
            <ShoppingBag size={20} className="md:w-6 md:h-6" />
            {cartCount > 0 && <span className="absolute top-1 right-1 bg-brand-gold text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}
          </button>
          
          {user ? (
            <div className="hidden md:flex items-center gap-4 xl:gap-6">
              {isAdmin && (
                <Link href="/admin" className="text-[9px] xl:text-[10px] uppercase tracking-[0.2em] font-bold text-brand-gold hover:text-brand-blue hover:bg-brand-gold border border-brand-gold/50 px-3 xl:px-4 py-1.5 rounded-sm transition-all duration-300">
                  Admin
                </Link>
              )}
              <Link href="/profile" className="hover:scale-110 transition-transform duration-300">
                <Image 
                  src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                  alt={user.displayName || 'User'} 
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-brand-gold/30 hover:border-brand-gold transition-all shadow-md" 
                />
              </Link>
              <button onClick={onLogout} className={`${isDarkMode ? 'text-brand-beige/40 hover:text-brand-gold' : 'text-brand-blue/40 hover:text-brand-gold'} transition-colors p-1`}><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={onLogin} className={`hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold ${isDarkMode ? 'text-brand-beige border-brand-beige/20' : 'text-brand-blue border-brand-blue/20'} px-5 py-2.5 border rounded-sm hover:bg-brand-gold hover:text-brand-blue hover:border-brand-gold transition-all duration-300`}>
              <User size={14} /> Login
            </button>
          )}
        </div>
      </div>
    </nav>

    {/* Mobile Menu - Outside nav to avoid clipping/transform issues */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-brand-blue/60 backdrop-blur-sm z-[100] lg:hidden"
          />
          
          {/* Side Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-sm z-[110] ${isDarkMode ? 'bg-brand-blue' : 'bg-brand-beige'} shadow-2xl flex flex-col lg:hidden overflow-hidden`}
          >
            {/* Heritage Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div className="absolute inset-0 bg-[url('/mandala.png')] bg-[length:400px] bg-center bg-repeat animate-slow-spin" />
            </div>

            {/* Close Button & Logo */}
            <div className="p-8 flex items-center justify-between border-b border-brand-gold/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-brand-gold flex items-center justify-center font-serif text-brand-gold text-xs">
                  N
                </div>
                <span className="font-serif tracking-[0.2em] text-brand-gold text-sm">NAVANIKA</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`p-2 ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'} hover:text-brand-gold transition-colors`}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-12 px-8 flex flex-col gap-12">
              {/* Navigation Links */}
              <div className="flex flex-col gap-8">
                <p className="text-[9px] uppercase tracking-[0.4em] font-black text-brand-gold/60 mb-2">Collections</p>
                {[
                  { name: 'Home', path: '/' },
                  { name: 'Sarees', path: '/category/sarees' },
                  { name: 'Formal', path: '/category/formal' },
                  { name: 'Casual', path: '/category/casual' },
                  { name: 'Fashion', path: '/category/fashion' },
                  { name: 'Trending', path: '/category/trending' }
                ].map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Link 
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between group`}
                    >
                      <span className={`text-xl md:text-2xl uppercase tracking-[0.15em] font-serif ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'} group-hover:text-brand-gold transition-all duration-300`}>
                        {item.name}
                      </span>
                      <ChevronRight size={18} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="h-[1px] w-full bg-brand-gold/10"></div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { onOpenWishlist(); setIsMobileMenuOpen(false); }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-sm border border-brand-gold/10 bg-brand-gold/5 ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'}`}
                >
                  <Heart size={20} className="text-brand-gold" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Wishlist</span>
                </button>
                <button 
                  onClick={() => { toggleDarkMode(); setIsMobileMenuOpen(false); }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-sm border border-brand-gold/10 bg-brand-gold/5 ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'}`}
                >
                  {isDarkMode ? <Sun size={20} className="text-brand-gold" /> : <Moon size={20} className="text-brand-gold" />}
                  <span className="text-[9px] font-black uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'} Mode</span>
                </button>
              </div>

              {/* Auth/Profile Section */}
              <div className="mt-auto space-y-6">
                {user ? (
                  <div className="space-y-6">
                    <Link 
                      href="/profile" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-sm border border-brand-gold/20 bg-brand-blue/5 dark:bg-white/5`}
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gold shadow-lg">
                        <Image 
                          src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                          alt={user.displayName || 'User'} 
                          fill
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-serif font-bold ${isDarkMode ? 'text-brand-beige' : 'text-brand-blue'}`}>{user.displayName || 'User'}</span>
                        <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">View Profile</span>
                      </div>
                    </Link>
                    
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] font-black text-brand-blue bg-brand-gold px-6 py-4 rounded-sm hover:bg-brand-blue hover:text-brand-gold transition-all shadow-xl"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} 
                      className={`w-full py-4 text-[9px] uppercase tracking-[0.3em] font-black border border-brand-gold/20 ${isDarkMode ? 'text-brand-beige/40' : 'text-brand-blue/40'} hover:text-red-500 transition-colors`}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { onLogin(); setIsMobileMenuOpen(false); }} 
                    className={`w-full flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-brand-beige bg-white/5 border-white/10' : 'text-brand-blue bg-brand-blue/5 border-brand-blue/10'} px-8 py-5 border rounded-sm hover:border-brand-gold transition-all shadow-sm`}
                  >
                    <User size={18} className="text-brand-gold" /> Login / Register
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
  );
}
