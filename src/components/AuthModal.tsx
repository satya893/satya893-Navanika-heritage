import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setEmail(''); setPassword(''); setName(''); setError(''); setShowPass(false);
  };

  const switchTab = (t: 'signin' | 'signup') => {
    setTab(t);
    reset();
  };

  const handleGoogle = async () => {
    setLoading(true); 
    setError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (e: any) {
      // Don't show error if user just closed the popup
      if (e.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      setError(e.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (tab === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (e: any) {
      const msg = e.code === 'auth/user-not-found' ? 'No account found with this email.'
        : e.code === 'auth/wrong-password' ? 'Incorrect password.'
        : e.code === 'auth/email-already-in-use' ? 'Email already in use.'
        : e.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
        : e.message || 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-brand-beige dark:bg-[#0e1a35] w-full max-w-md rounded-sm shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-brand-blue dark:bg-[#060d1f] px-10 pt-12 pb-8 text-center">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-brand-beige/40 hover:text-brand-beige transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-brand-gold text-lg font-serif">N</span>
            </div>
            <h2 className="text-2xl font-serif text-brand-beige tracking-wide">NAVANIKA</h2>
            <p className="text-brand-gold text-[9px] font-black uppercase tracking-[0.5em] mt-1">Heritage Atelier</p>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-brand-blue/10 dark:border-white/10 bg-brand-beige dark:bg-[#0e1a35]">
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.4em] transition-all ${
                  tab === t
                    ? 'text-brand-blue dark:text-brand-beige border-b-2 border-brand-gold'
                    : 'text-brand-blue/30 dark:text-brand-beige/30 hover:text-brand-blue/60 dark:hover:text-brand-beige/60'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="px-10 py-8 bg-brand-beige dark:bg-[#0e1a35]">
            {/* Google Button */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-brand-blue/20 dark:border-white/10 py-4 text-[10px] uppercase tracking-[0.3em] font-black text-brand-blue dark:text-brand-beige hover:bg-brand-blue dark:hover:bg-white/10 hover:text-brand-beige transition-all mb-6 rounded-sm disabled:opacity-50"
            >
              <Globe size={16} />
              Continue with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-brand-blue/10 dark:bg-white/10" />
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-blue/30 dark:text-brand-beige/30">or</span>
              <div className="flex-1 h-px bg-brand-blue/10 dark:bg-white/10" />
            </div>

            <form onSubmit={handleEmail} className="space-y-4">
              {tab === 'signup' && (
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue/30 dark:text-brand-beige/30" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 pl-10 pr-4 py-4 text-sm font-medium text-brand-blue dark:text-brand-beige placeholder-brand-blue/30 dark:placeholder-brand-beige/30 focus:outline-none focus:border-brand-gold transition-colors rounded-sm"
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue/30 dark:text-brand-beige/30" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 pl-10 pr-4 py-4 text-sm font-medium text-brand-blue dark:text-brand-beige placeholder-brand-blue/30 dark:placeholder-brand-beige/30 focus:outline-none focus:border-brand-gold transition-colors rounded-sm"
                />
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue/30 dark:text-brand-beige/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 pl-10 pr-12 py-4 text-sm font-medium text-brand-blue dark:text-brand-beige placeholder-brand-blue/30 dark:placeholder-brand-beige/30 focus:outline-none focus:border-brand-gold transition-colors rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-blue/30 dark:text-brand-beige/30 hover:text-brand-blue dark:hover:text-brand-beige transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-[10px] font-bold tracking-wide">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gold text-white py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all mt-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Please wait...' : tab === 'signin' ? 'Sign In to Atelier' : 'Join Navanika'}
              </button>
            </form>

            <p className="text-center text-[9px] text-brand-blue/30 dark:text-brand-beige/30 mt-6 uppercase tracking-widest">
              {tab === 'signin' ? "Don't have an account? " : 'Already a member? '}
              <button
                onClick={() => switchTab(tab === 'signin' ? 'signup' : 'signin')}
                className="text-brand-gold hover:underline font-black"
              >
                {tab === 'signin' ? 'Join Now' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
