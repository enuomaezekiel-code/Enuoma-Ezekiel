import React, { useState } from 'react';
import {
  PlusCircle,
  Banknote,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Tag,
  Link as LinkIcon,
  ShieldCheck,
  X,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TASK_CATEGORIES, NIGERIAN_POPULAR_SKILLS } from '../types';
import { createTask } from '../services/taskService';

interface PostTaskViewProps {
  onSelectTab: (tab: string) => void;
}

export const PostTaskView: React.FC<PostTaskViewProps> = ({ onSelectTab }) => {
  const { currentUser, userProfile, signInWithGoogle } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(TASK_CATEGORIES[0]);
  const [budgetNgn, setBudgetNgn] = useState<number | ''>(25000);
  const [deadline, setDeadline] = useState('');
  const [skills, setSkills] = useState<string[]>(['Graphic Design']);
  const [customSkill, setCustomSkill] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [safetyAccepted, setSafetyAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddSkill = (skill: string) => {
    if (skills.length >= 8) return;
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 8) {
      setSkills([...skills, trimmed]);
      setCustomSkill('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      await signInWithGoogle();
      return;
    }

    if (userProfile?.isSuspended) {
      setError('Your account is currently suspended. You cannot post tasks.');
      return;
    }

    if (!title.trim() || title.trim().length < 10) {
      setError('Please provide a clear title of at least 10 characters.');
      return;
    }

    if (!description.trim() || description.trim().length < 30) {
      setError('Please provide a detailed task briefing of at least 30 characters.');
      return;
    }

    if (!budgetNgn || Number(budgetNgn) < 1000) {
      setError('Please set a fixed budget of at least ₦1,000 NGN.');
      return;
    }

    if (!deadline) {
      setError('Please specify an expected delivery deadline.');
      return;
    }

    if (!safetyAccepted) {
      setError('Please confirm that this task conforms to TaskNaija safety and non-fraud guidelines.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        budgetNgn: Number(budgetNgn),
        deadline,
        requiredSkills: skills,
        attachmentUrls: attachmentUrl.trim() ? [attachmentUrl.trim()] : [],
        clientId: currentUser.uid,
        clientName: userProfile?.displayName || currentUser.displayName || 'Nigerian Client',
        clientPhoto: currentUser.photoURL || '',
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSelectTab('my-work');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to post task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Client Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Post a Digital Task on TaskNaija
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Specify your requirements, set your fixed reward in Nigerian naira (₦ NGN), and connect with skilled
            local freelancers.
          </p>
        </div>

        {success ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-lg font-black text-slate-900">Task Successfully Published!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your task is now live on the marketplace. Nigerian workers can submit proposals. Redirecting to your
              work dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Design 5 Social Media Flyer Templates for Real Estate Company in Lagos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50 font-medium"
                required
              />
              <p className="text-[11px] text-slate-400 text-right mt-1">{title.length}/140</p>
            </div>

            {/* Category and Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Task Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50 font-medium"
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fixed Reward in Naira (₦ NGN) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-emerald-800 text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    placeholder="25000"
                    value={budgetNgn}
                    onChange={(e) => setBudgetNgn(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs sm:text-sm pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50 font-bold text-emerald-900"
                    required
                  />
                </div>
                {budgetNgn !== '' && Number(budgetNgn) > 0 && (
                  <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                    Worker reward: ₦{Number(budgetNgn).toLocaleString('en-NG')}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Briefing & Instructions <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Explain exactly what needs to be created, dimensions, reference styles, delivery format (PDF, PNG, MP4, Excel), and any key guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50 leading-relaxed resize-none"
                required
              />
              <p className="text-[11px] text-slate-400 text-right mt-1">{description.length}/3000</p>
            </div>

            {/* Deadline and Attachment Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Target Delivery Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  Reference Link / Drive / Figma (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50"
                />
              </div>
            </div>

            {/* Required Skills Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Required Skills & Tools</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-emerald-700 hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom skill (e.g. Canva, Figma, SQL)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="flex-1 text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[11px] text-slate-400 self-center mr-1">Suggested:</span>
                {NIGERIAN_POPULAR_SKILLS.slice(0, 6).map((pop) => (
                  <button
                    key={pop}
                    type="button"
                    onClick={() => handleAddSkill(pop)}
                    className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2 py-1 rounded-md transition"
                  >
                    + {pop}
                  </button>
                ))}
              </div>
            </div>

            {/* Safety & Anti-Fraud Guarantee Checkbox */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyAccepted}
                  onChange={(e) => setSafetyAccepted(e.target.checked)}
                  className="mt-1 rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold block">TaskNaija Trust & Safety Compliance Pledge</span>
                  I confirm that this task is legitimate digital work. It does not solicit registration fees, pyramid
                  schemes, academic cheating/plagiarism, illegal activities, or sensitive bank credentials (BVN, PIN,
                  OTP). I agree to settle the agreed naira amount directly upon satisfactory delivery.
                </div>
              </label>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => onSelectTab('home')}
                className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                {submitting ? 'Publishing Task...' : 'Publish Task (₦ NGN)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
