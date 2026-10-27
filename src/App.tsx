import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { testFirestoreConnection } from './firebase';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SafetyBanner } from './components/SafetyBanner';
import { HomeView } from './views/HomeView';
import { FindTasksView } from './views/FindTasksView';
import { PostTaskView } from './views/PostTaskView';
import { MyWorkView } from './views/MyWorkView';
import { ProfileView } from './views/ProfileView';
import { AdminView } from './views/AdminView';
import { TaskItem } from './types';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

function MainApp() {
  const { userProfile, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const handleSelectTaskFromHome = (task: TaskItem) => {
    setSelectedTask(task);
    setCurrentTab('find-tasks');
  };

  const handleCategoryFilterFromHome = (cat: string) => {
    setCategoryFilter(cat);
    setCurrentTab('find-tasks');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center mx-auto animate-pulse">
            ₦
          </div>
          <div className="text-sm font-bold text-slate-800">TaskNaija</div>
          <div className="text-xs text-slate-400">Loading Nigerian Digital Marketplace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Advisory Banner */}
      <SafetyBanner />

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedTask(null);
          setCurrentTab(tab);
        }}
        onOpenAdmin={() => setCurrentTab('admin')}
      />

      {/* Suspension Notice if current user is flagged */}
      {userProfile?.isSuspended && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-bold">Account Suspended:</span> Your account has been suspended following a safety
            report. You cannot post tasks or apply. Please contact our administrative moderation team.
          </div>
        </div>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentTab === 'home' && (
          <HomeView
            onSelectTab={setCurrentTab}
            onSelectTask={handleSelectTaskFromHome}
            onFilterCategory={handleCategoryFilterFromHome}
          />
        )}

        {currentTab === 'find-tasks' && (
          <FindTasksView
            initialCategory={categoryFilter}
            selectedTask={selectedTask}
            onClearSelectedTask={() => setSelectedTask(null)}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'post-task' && <PostTaskView onSelectTab={setCurrentTab} />}

        {currentTab === 'my-work' && <MyWorkView onSelectTab={setCurrentTab} />}

        {currentTab === 'profile' && <ProfileView />}

        {currentTab === 'admin' && <AdminView onBack={() => setCurrentTab('home')} />}
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedTask(null);
          setCurrentTab(tab);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
