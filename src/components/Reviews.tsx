"use client";

import React, { useState, useEffect } from 'react';
import { Star, User, MessageSquare, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsProps {
  productId: string;
}

export default function Reviews({ productId }: ReviewsProps) {
  const { user, setIsAuthOpen } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0],
          userImage: user.photoURL,
          rating: newRating,
          comment: newComment
        }),
      });

      if (res.ok) {
        const addedReview = await res.json();
        setReviews(prev => [addedReview, ...prev]);
        setNewComment('');
        setNewRating(5);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
    : 0;

  return (
    <div className="mt-32 max-w-5xl mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-brand-gold/10 pb-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif text-brand-blue dark:text-brand-beige mb-4 tracking-tight">Customer Impressions</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={`${star <= Math.round(averageRating) ? 'text-brand-gold fill-brand-gold' : 'text-brand-blue/20 dark:text-brand-beige/20'}`}
                />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold">
              {reviews.length} Certified {reviews.length === 1 ? 'Legacy' : 'Legacies'}
            </span>
          </div>
        </div>
      </div>

      {/* Write a Review - Premium Form */}
      <div className="bg-white dark:bg-white/5 border border-brand-gold/10 p-8 md:p-12 rounded-sm mb-24 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-xl font-serif text-brand-blue dark:text-brand-beige">Share Your Experience</h3>
        </div>
        
        <form onSubmit={handleSubmitReview}>
          <div className="mb-10">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-brand-blue/40 dark:text-brand-beige/40 mb-4">Quality Rating</p>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-125 active:scale-95 duration-300"
                >
                  <Star
                    size={32}
                    className={`${star <= (hoverRating || newRating) ? 'text-brand-gold fill-brand-gold' : 'text-brand-blue/10 dark:text-white/10'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <label className="text-[9px] font-black uppercase tracking-[0.5em] text-brand-blue/40 dark:text-brand-beige/40 block mb-4">Your Narrative</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tell us about the craftsmanship, fit, and elegance..."
              rows={5}
              className="w-full bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 p-6 text-base text-brand-blue dark:text-brand-beige placeholder-brand-blue/20 dark:placeholder-brand-beige/20 focus:outline-none focus:border-brand-gold transition-all rounded-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="group relative bg-brand-gold text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm overflow-hidden transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(184,142,47,0.3)]"
          >
            <div className="absolute inset-0 bg-brand-blue translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <div className="relative z-10 flex items-center justify-center gap-4">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>{submitting ? 'Authenticating...' : 'Post Impression'}</span>
            </div>
          </button>
        </form>
      </div>

      {/* Review List - Elegant Cards */}
      <div className="grid grid-cols-1 gap-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-brand-gold" size={40} />
            <p className="text-[9px] uppercase tracking-[0.5em] text-brand-gold font-black">Reading the testimonials...</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-white/5 border border-brand-gold/10 p-8 md:p-10 rounded-sm shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-brand-gold to-transparent">
                    <div className="w-full h-full rounded-full bg-brand-blue dark:bg-brand-beige border-2 border-white dark:border-brand-blue flex items-center justify-center overflow-hidden">
                      {review.userImage ? (
                        <img src={review.userImage} alt={review.userName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-brand-gold/40" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-serif text-brand-blue dark:text-brand-beige leading-none mb-2">{review.userName}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={10}
                            className={`${star <= review.rating ? 'text-brand-gold fill-brand-gold' : 'text-brand-blue/10 dark:text-white/10'}`}
                          />
                        ))}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-brand-gold/30" />
                      <p className="text-[9px] text-brand-blue/40 dark:text-brand-beige/40 font-black uppercase tracking-widest">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-brand-blue dark:text-brand-beige leading-relaxed font-serif text-xl italic opacity-80 pl-4 border-l-2 border-brand-gold/20">
                "{review.comment}"
              </p>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-24 bg-brand-gold/5 rounded-sm border border-dashed border-brand-gold/20">
            <MessageSquare size={48} className="text-brand-gold/20 mx-auto mb-6" />
            <p className="text-brand-gold text-[10px] uppercase tracking-[0.5em] font-black">No impressions yet. Be the first to share your journey.</p>
          </div>
        )}
      </div>
    </div>
  );
}
