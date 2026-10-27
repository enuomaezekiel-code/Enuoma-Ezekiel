import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Briefcase, Plus, LogIn, LogOut, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAdmin }) => {
  const { currentUser, userProfile, activeRole, setActiveRole, isAdmin, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-hidden group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition">
            ₦
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">TaskNaija</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pilot
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Real Skills. Real Tasks. Real Opportunities.
            </p>
          </div>
        </button>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              currentTab === 'home'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('find-tasks')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              currentTab === 'find-tasks'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Find Tasks
          </button>
          <button
            onClick={() => onSelectTab('post-task')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              currentTab === 'post-task'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Post a Task
          </button>
          {currentUser && (
            <button
              onClick={() => onSelectTab('my-work')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                currentTab === 'my-work'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              My Work
            </button>
          )}
        </nav>

        {/* User / Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              {/* Role Switcher Pill */}
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-medium border border-slate-200">
                <button
                  onClick={() => setActiveRole('worker')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeRole === 'worker'
                      ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Freelancer mode"
                >
                  Worker
                </button>
                <button
                  onClick={() => setActiveRole('client')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeRole === 'client'
                      ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Client/Employer mode"
                >
                  Client
                </button>
              </div>

              {/* Admin Badge */}
              {isAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  Admin
                </button>
              )}

              {/* Profile Avatar / Menu */}
              <button
                onClick={() => onSelectTab('profile')}
                className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 border border-slate-200 transition"
              >
                <span className="text-xs font-semibold text-slate-800 hidden lg:inline max-w-[100px] truncate">
                  {userProfile?.displayName || currentUser.displayName || 'Account'}
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-center text-xs overflow-hidden">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (userProfile?.displayName?.[0] || 'N').toUpperCase()
                  )}
                </div>
              </button>

              <button
                onClick={signOut}
                className="hidden md:flex p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm transition active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
