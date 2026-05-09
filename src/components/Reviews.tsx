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
    <div className="mt-24 max-w-4xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-serif text-brand-blue dark:text-brand-beige mb-2">Customer Impressions</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`${star <= Math.round(averageRating) ? 'text-brand-gold fill-brand-gold' : 'text-brand-blue/20 dark:text-brand-beige/20'}`}
                />
              ))}
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-brand-blue/40 dark:text-brand-beige/40">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
        </div>
      </div>

      {/* Write a Review */}
      <div className="bg-white dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 p-8 rounded-sm mb-16">
        <h3 className="text-lg font-serif text-brand-blue dark:text-brand-beige mb-6">Share Your Experience</h3>
        <form onSubmit={handleSubmitReview}>
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue/50 dark:text-brand-beige/50 mb-3">Rating</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={24}
                    className={`${star <= (hoverRating || newRating) ? 'text-brand-gold fill-brand-gold' : 'text-brand-blue/20 dark:text-brand-beige/20'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue/50 dark:text-brand-beige/50 block mb-3">Review Message</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tell us about the craftsmanship, fit, and feel..."
              rows={4}
              className="w-full bg-brand-blue/5 dark:bg-white/5 border border-brand-blue/10 dark:border-white/10 p-5 text-sm text-brand-blue dark:text-brand-beige placeholder-brand-blue/30 dark:placeholder-brand-beige/30 focus:outline-none focus:border-brand-gold transition-colors rounded-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-brand-gold text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-blue dark:hover:bg-white dark:hover:text-brand-blue transition-all flex items-center gap-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-gold/10"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? 'Submitting...' : 'Post Review'}
          </button>
        </form>
      </div>

      {/* Review List */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-gold" size={32} />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-brand-blue/10 dark:border-white/10 pb-8 last:border-0"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/5 dark:bg-white/10 border border-brand-gold/20 flex items-center justify-center overflow-hidden">
                    {review.userImage ? (
                      <img src={review.userImage} alt={review.userName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-brand-gold/40" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-brand-blue dark:text-brand-beige">{review.userName}</h4>
                    <p className="text-[10px] text-brand-blue/40 dark:text-brand-beige/40 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className={`${star <= review.rating ? 'text-brand-gold fill-brand-gold' : 'text-brand-blue/20 dark:text-brand-beige/20'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-brand-blue/70 dark:text-brand-beige/70 leading-relaxed font-serif text-lg">
                {review.comment}
              </p>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-brand-blue/5 dark:bg-white/5 rounded-sm border border-dashed border-brand-blue/10 dark:border-white/10">
            <MessageSquare size={32} className="text-brand-gold/20 mx-auto mb-4" />
            <p className="text-brand-blue/40 dark:text-brand-beige/40 text-[10px] uppercase tracking-[0.4em] font-black">No impressions yet. Be the first to share.</p>
          </div>
        )}
      </div>
    </div>
  );
}
