import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Search,
  PlusCircle,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Banknote,
  Users,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskItem, TASK_CATEGORIES } from '../types';
import { getTasks } from '../services/taskService';

interface HomeViewProps {
  onSelectTab: (tab: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onFilterCategory: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Graphic Design': '🎨',
  'Video Editing': '🎬',
  'Writing and Typing': '✍️',
  'Social Media Content': '📱',
  'Data Entry': '📊',
  'Website and Technical Help': '💻',
};

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTab, onSelectTask, onFilterCategory }) => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [featuredTasks, setFeaturedTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTasks() {
      try {
        const tasks = await getTasks();
        if (isMounted) {
          setFeaturedTasks(tasks.filter((t) => t.status === 'OPEN' || t.status === 'APPLICATIONS_RECEIVED').slice(0, 6));
        }
      } catch (err) {
        console.error('Error loading featured tasks:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePostTask = () => {
    if (!currentUser) {
      signInWithGoogle();
    } else {
      onSelectTab('post-task');
    }
  };

  const handleFindTasks = () => {
    onSelectTab('find-tasks');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-10 shadow-xl border border-emerald-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Nigeria's Digital Freelance Hub
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Real Skills. Real Tasks. <br />
            <span className="text-emerald-400">Real Nigerian Opportunities.</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Connecting Nigerian clients who need legitimate digital work done with verified local freelancers who
            deliver on time. Transparent NGN pricing, zero application fees, and verified deliverables.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleFindTasks}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/25"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              Browse Tasks
            </button>

            <button
              onClick={handlePostTask}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 active:scale-95 transition backdrop-blur-xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Post a Task
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-slate-300 text-[11px] sm:text-xs">
            <div>
              <span className="font-extrabold text-white text-sm block">₦0 Fee</span>
              To apply or register
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">Direct NGN</span>
              Client-to-Worker Pay
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">100% Legit</span>
              Strict anti-scam review
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Explore Work Categories</h2>
            <p className="text-xs text-slate-500">Pick a category to browse active freelance tasks across Nigeria</p>
          </div>
          <button
            onClick={() => onSelectTab('find-tasks')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            All Categories <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {TASK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                onFilterCategory(cat);
                onSelectTab('find-tasks');
              }}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition text-left group flex flex-col justify-between"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition">{CATEGORY_ICONS[cat] || '💼'}</div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                  {cat}
                </h3>
                <span className="text-[10px] text-slate-400 mt-0.5 block">View open jobs</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Open Tasks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Recent Digital Tasks</h2>
            <p className="text-xs text-slate-500">Fresh jobs posted by verified Nigerian clients</p>
          </div>
          <button
            onClick={() => onSelectTab('find-tasks')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View More <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : featuredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Open Tasks Right Now</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Be the first to post a digital task or check back shortly as clients list new opportunities daily.
              </p>
            </div>
            <button
              onClick={handlePostTask}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Post the First Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-emerald-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate">
                      {task.category}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {task.deadline || 'Flexible'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>

                  {task.requiredSkills && task.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {task.requiredSkills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {task.requiredSkills.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{task.requiredSkills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fixed Budget</span>
                    <span className="text-sm font-black text-emerald-800">
                      ₦{task.budgetNgn.toLocaleString('en-NG')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                    View Details
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How TaskNaija Works */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Simple & Trustworthy</span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">How TaskNaija Works in Nigeria</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Designed for seamless cooperation between Nigerian clients and freelancers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-sm text-white">Post with Fixed NGN Budget</h3>
            <p className="text-xs text-slate-300">
              Clients list what needs to be done, the category, the deadline, and the exact naira reward.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-sm text-white">Vetted Workers Apply</h3>
            <p className="text-xs text-slate-300">
              Skilled workers submit proposals. Zero application fees. Review portfolio links and hire the best match.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-sm text-white">Submit Work & Revisions</h3>
            <p className="text-xs text-slate-300">
              Worker delivers the finished file or link. Client can approve or request revisions with written feedback.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
              4
            </div>
            <h3 className="font-bold text-sm text-white">Direct Settlement & Reviews</h3>
            <p className="text-xs text-slate-300">
              Client transfers funds directly to worker's Nigerian bank account upon approval, then both rate the job.
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Anti-Fraud Notice */}
      <section className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 space-y-2 text-emerald-950">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-emerald-900">TaskNaija Anti-Scam Standard</h3>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          TaskNaija is completely free for workers to register and apply. We actively ban fake job listings, pyramid schemes,
          requests for bank passwords/BVN/OTPs, and academic malpractice. Report any suspicious task or user to our admin team
          immediately with one tap.
        </p>
      </section>
    </div>
  );
};
