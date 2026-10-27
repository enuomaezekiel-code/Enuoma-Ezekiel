import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Clock, Banknote, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskItem } from '../types';
import { submitApplication } from '../services/applicationService';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onApplied?: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ isOpen, onClose, task, onApplied }) => {
  const { currentUser, userProfile, signInWithGoogle } = useAuth();
  const [pitch, setPitch] = useState('');
  const [proposedDays, setProposedDays] = useState(3);
  const [bidAmountNgn, setBidAmountNgn] = useState(task.budgetNgn || 15000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }

    if (userProfile?.isSuspended) {
      setError('Your account is currently suspended. Please contact support.');
      return;
    }

    if (currentUser.uid === task.clientId) {
      setError('You cannot apply to your own task.');
      return;
    }

    if (!pitch.trim() || pitch.trim().length < 20) {
      setError('Please write a proposal pitch of at least 20 characters explaining how you will execute this task.');
      return;
    }

    if (bidAmountNgn <= 0) {
      setError('Please provide a valid bid amount in NGN.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitApplication({
        taskId: task.id,
        taskTitle: task.title,
        clientId: task.clientId,
        workerId: currentUser.uid,
        workerName: userProfile?.displayName || currentUser.displayName || 'Nigerian Freelancer',
        workerPhoto: currentUser.photoURL || '',
        workerBio: userProfile?.bio || '',
        workerSkills: userProfile?.skills || [],
        workerCompletedJobs: userProfile?.completedJobs || 0,
        pitch: pitch.trim(),
        proposedDays: Number(proposedDays),
        bidAmountNgn: Number(bidAmountNgn),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPitch('');
        onApplied?.();
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {task.category}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">{task.title}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
            <span className="font-extrabold text-emerald-700 text-sm">
              Budget: ₦{task.budgetNgn.toLocaleString('en-NG')}
            </span>
            <span>•</span>
            <span className="text-slate-500">Client: {task.clientName}</span>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-slate-900 text-base">Application Submitted!</h4>
            <p className="text-xs text-slate-500">
              The client will review your proposal. You can monitor its progress in "My Work".
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Your Proposal Pitch <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                rows={4}
                placeholder="Explain your approach, past experience with this work, tools you will use, and why you are the best choice..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden resize-none bg-slate-50/50"
                maxLength={2000}
                required
              />
              <p className="text-[11px] text-slate-400 text-right mt-0.5">{pitch.length}/2000</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Estimated Delivery Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={proposedDays}
                  onChange={(e) => setProposedDays(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-slate-500" />
                  Proposed Bid (₦ NGN)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={bidAmountNgn}
                  onChange={(e) => setBidAmountNgn(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden bg-slate-50/50 font-bold text-emerald-800"
                  required
                />
              </div>
            </div>

            {/* Safety pledge */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5 text-[11px] text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Nigerian Pilot Safety Guarantee:</span> TaskNaija never charges fees to
                apply or hire. Direct payment arrangements are agreed directly with the client upon verified
                delivery.
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
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
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
