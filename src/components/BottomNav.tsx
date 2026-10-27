import React from 'react';
import { Home, Search, PlusCircle, Briefcase, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, signInWithGoogle } = useAuth();

  const handleWorkClick = () => {
    if (!currentUser) {
      signInWithGoogle();
    } else {
      onSelectTab('my-work');
    }
  };

  const handleProfileClick = () => {
    if (!currentUser) {
      signInWithGoogle();
    } else {
      onSelectTab('profile');
    }
  };

  const handlePostClick = () => {
    if (!currentUser) {
      signInWithGoogle();
    } else {
      onSelectTab('post-task');
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          currentTab === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      <button
        onClick={() => onSelectTab('find-tasks')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          currentTab === 'find-tasks' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Search className={`w-5 h-5 ${currentTab === 'find-tasks' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">Find Tasks</span>
      </button>

      <button
        onClick={handlePostClick}
        className="flex flex-col items-center justify-center -mt-3.5 group"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-active:scale-95 transition">
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-semibold text-emerald-800 mt-0.5">Post Task</span>
      </button>

      <button
        onClick={handleWorkClick}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          currentTab === 'my-work' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Briefcase className={`w-5 h-5 ${currentTab === 'my-work' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">My Work</span>
      </button>

      <button
        onClick={handleProfileClick}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          currentTab === 'profile' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">Profile</span>
      </button>
    </nav>
  );
};
