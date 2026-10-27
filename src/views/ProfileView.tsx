import React, { useState, useEffect } from 'react';
import {
  User,
  Star,
  Award,
  Briefcase,
  MapPin,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NIGERIAN_CITIES, NIGERIAN_POPULAR_SKILLS, UserReview } from '../types';
import { getUserReviews } from '../services/reviewService';

export const ProfileView: React.FC = () => {
  const { currentUser, userProfile, updateProfile, signInWithGoogle, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState(NIGERIAN_CITIES[0]);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [role, setRole] = useState<'client' | 'worker' | 'both'>('both');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || NIGERIAN_CITIES[0]);
      setPortfolioUrl(userProfile.portfolioUrl || '');
      setSkills(userProfile.skills || []);
      setRole(userProfile.role || 'both');

      // Fetch real reviews
      setLoadingReviews(true);
      getUserReviews(userProfile.uid)
        .then((res) => setReviews(res))
        .catch((err) => console.error('Failed to load reviews:', err))
        .finally(() => setLoadingReviews(false));
    }
  }, [userProfile]);

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 12) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location,
        portfolioUrl: portfolioUrl.trim(),
        skills,
        role,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsEditing(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Sign In to TaskNaija</h2>
        <p className="text-xs text-slate-500">
          Create or access your verified Nigerian freelance profile, manage tasks, and track job payments.
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // Profile completion score
  const completionScore = [
    Boolean(userProfile?.displayName),
    Boolean(userProfile?.bio && userProfile.bio.length > 20),
    Boolean(userProfile?.skills && userProfile.skills.length >= 2),
    Boolean(userProfile?.portfolioUrl),
    Boolean(userProfile?.location),
  ].filter(Boolean).length * 20;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-800 font-black text-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (userProfile?.displayName?.[0] || 'N').toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  {userProfile?.displayName || currentUser.displayName}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {userProfile?.role === 'both' ? 'Client & Worker' : userProfile?.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {userProfile?.location || 'Lagos, Nigeria'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Member since{' '}
                  {userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString('en-NG', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '2026'}
                </span>
              </div>

              {/* Verified badge */}
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                TaskNaija Community Member (Auth Verified)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button
              onClick={signOut}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700">Profile Strength</span>
            <span className="font-extrabold text-emerald-700">{completionScore}% Complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Jobs</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {userProfile?.completedJobs || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Rating Score</span>
            <span className="text-xl font-black text-amber-600 mt-0.5 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              {userProfile?.ratingCount ? userProfile.rating?.toFixed(1) : '5.0'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ({userProfile?.ratingCount || 0} reviews)
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Trust Level</span>
            <span className="text-sm font-black text-emerald-800 mt-1 block">Good Standing</span>
            <span className="text-[10px] text-slate-400 block">Zero safety flags</span>
          </div>
        </div>

        {/* Bio & Skills (Read View) */}
        {!isEditing && (
          <div className="space-y-4 mt-6 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Biography</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {userProfile?.bio || 'No biography written yet. Click "Edit Profile" to tell clients about your background.'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Skills & Tools</h3>
              <div className="flex flex-wrap gap-1.5">
                {userProfile?.skills && userProfile.skills.length > 0 ? (
                  userProfile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No skills added yet.</span>
                )}
              </div>
            </div>

            {userProfile?.portfolioUrl && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Portfolio & Samples</h3>
                <a
                  href={userProfile.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {userProfile.portfolioUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="space-y-4 mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Update Profile Details</h3>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-hidden focus:border-emerald-600 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-hidden focus:border-emerald-600 bg-slate-50/50"
                >
                  {NIGERIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['both', 'worker', 'client'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-bold rounded-xl border transition capitalize ${
                      role === r
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'both' ? 'Both (Dual)' : r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Biography / Summary</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={1000}
                placeholder="Describe your freelance capabilities or typical tasks you commission..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 outline-hidden focus:border-emerald-600 bg-slate-50/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Portfolio or Sample Link (Google Drive, Behance, GitHub)
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-hidden focus:border-emerald-600 bg-slate-50/50"
              />
            </div>

            {/* Skills tag editor */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Skills</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-semibold"
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill (e.g. Canva, Video Editing)..."
                  className="flex-1 text-xs rounded-xl border border-slate-300 p-2 outline-hidden focus:border-emerald-600 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkill)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mt-1">
                {NIGERIAN_POPULAR_SKILLS.slice(0, 5).map((pop) => (
                  <button
                    key={pop}
                    type="button"
                    onClick={() => handleAddSkill(pop)}
                    className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-600 px-2 py-0.5 rounded-md"
                  >
                    + {pop}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Reviews Received Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Task Reviews & Feedback</h2>
          <span className="text-xs text-slate-500">{reviews.length} total reviews</span>
        </div>

        {loadingReviews ? (
          <p className="text-xs text-slate-400">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <Star className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">No Reviews Yet</h4>
            <p className="text-xs text-slate-400">
              Reviews will appear here once tasks are marked completed and rated by clients or workers.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{rev.authorName}</span>
                    <span className="text-[10px] text-slate-400">
                      • {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
