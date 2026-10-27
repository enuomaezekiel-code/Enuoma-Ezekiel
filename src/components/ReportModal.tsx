import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitSafetyReport } from '../services/trustService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'task' | 'user' | 'job';
  targetId: string;
  targetTitle: string;
}

const REPORT_REASONS = [
  'Scam or upfront registration/recruitment fee requested',
  'Requesting sensitive info (BVN, bank password, OTP, ATM card)',
  'Fake task or misleading project details',
  'Academic cheating / coursework plagiarism',
  'Pyramid scheme, network marketing, or paid-to-click',
  'Payment dispute or refusal to settle agreed terms',
  'Abusive, threatening, or unprofessional behavior',
  'Other violation of Nigerian labor & safety ethics',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { currentUser, userProfile, signInWithGoogle } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }

    if (!details.trim()) {
      setError('Please provide specific details explaining the safety issue.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitSafetyReport({
        reporterId: currentUser.uid,
        reporterName: userProfile?.displayName || currentUser.displayName || 'Concerned User',
        targetType,
        targetId,
        targetTitle,
        reason,
        details: details.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails('');
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
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
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Report {targetType === 'task' ? 'Task' : targetType === 'user' ? 'User' : 'Job Dispute'}
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[240px]">Target: {targetTitle}</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Report Submitted for Admin Review</h4>
            <p className="text-xs text-slate-500">
              Thank you for keeping TaskNaija safe. Our administrative team will investigate promptly.
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Violation Category</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden bg-slate-50/50"
              >
                {REPORT_REASONS.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Detailed Explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Describe what occurred, any WhatsApp/phone messages, or suspicious demands made..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden resize-none bg-slate-50/50"
                maxLength={2000}
                required
              />
              <p className="text-[11px] text-slate-400 text-right mt-0.5">{details.length}/2000</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              TaskNaija strictly prohibits scams, recruitment fees, academic cheating, and fraudulent offers. False
              reports are also subject to review.
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
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition shadow-xs"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
