import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitReview } from '../services/reviewService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  targetUserId: string;
  targetUserName: string;
  roleReviewed: 'client' | 'worker';
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  taskId,
  targetUserId,
  targetUserName,
  roleReviewed,
  onReviewSubmitted,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!comment.trim()) {
      setError('Please write a brief feedback comment.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitReview({
        taskId,
        authorId: currentUser.uid,
        authorName: userProfile?.displayName || currentUser.displayName || 'Anonymous User',
        targetUserId,
        roleReviewed,
        rating,
        comment: comment.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        onReviewSubmitted?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Review {roleReviewed === 'worker' ? 'Freelancer' : 'Client'}
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[240px]">Rate {targetUserName}</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Rating Recorded!</h4>
            <p className="text-xs text-slate-500">Thank you for your honest feedback on TaskNaija.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="text-center py-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Overall Experience Rating</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-hidden transition transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-7 h-7 transition ${
                          filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="inline-block text-xs font-bold text-amber-700 mt-1">
                {rating === 5
                  ? '5.0 - Excellent Delivery'
                  : rating === 4
                  ? '4.0 - Good Job'
                  : rating === 3
                  ? '3.0 - Satisfactory'
                  : rating === 2
                  ? '2.0 - Poor Execution'
                  : '1.0 - Highly Unsatisfactory'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Written Feedback <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Share your experience working on this task (communication, promptness, quality)..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden resize-none bg-slate-50/50"
                maxLength={1500}
                required
              />
              <p className="text-[11px] text-slate-400 text-right mt-0.5">{comment.length}/1500</p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
              >
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
