import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  Banknote,
  Send,
  ShieldAlert,
  Layers,
  ArrowUpDown,
  Tag,
  ExternalLink,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskItem, TASK_CATEGORIES } from '../types';
import { getTasks } from '../services/taskService';
import { ApplyModal } from '../components/ApplyModal';
import { ReportModal } from '../components/ReportModal';

interface FindTasksViewProps {
  initialCategory?: string;
  selectedTask?: TaskItem | null;
  onClearSelectedTask?: () => void;
  onSelectTab: (tab: string) => void;
}

export const FindTasksView: React.FC<FindTasksViewProps> = ({
  initialCategory = 'All',
  selectedTask: externalSelectedTask,
  onClearSelectedTask,
  onSelectTab,
}) => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(initialCategory || 'All');
  const [sortBy, setSortBy] = useState<'newest' | 'budgetHigh' | 'budgetLow'>('newest');
  const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);

  // Modals & Selected Task
  const [activeTask, setActiveTask] = useState<TaskItem | null>(externalSelectedTask || null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (externalSelectedTask) {
      setActiveTask(externalSelectedTask);
    }
  }, [externalSelectedTask]);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result = await getTasks({
        category: category !== 'All' ? category : undefined,
        searchQuery: searchQuery.trim() || undefined,
        minBudget: minBudget ? Number(minBudget) : undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        sortBy,
      });
      setTasks(result);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [category, sortBy, minBudget, maxBudget]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const handleApplyClick = (task: TaskItem) => {
    setActiveTask(task);
    if (!currentUser) {
      signInWithGoogle();
    } else {
      setIsApplyOpen(true);
    }
  };

  const handleReportClick = (task: TaskItem) => {
    setActiveTask(task);
    setIsReportOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search and Filter Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Find Digital Tasks in Nigeria</h1>
          <p className="text-xs text-slate-500">
            Browse legitimate freelance jobs paying in Nigerian naira (₦ NGN). Zero application fees.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, description, or skill (e.g. Logo, Video, Excel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
          >
            Search
          </button>
        </form>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              category === 'All'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tasks
          </button>
          {TASK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                category === cat
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters: Budget & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-slate-500" /> Budget:
            </span>
            <input
              type="number"
              placeholder="Min ₦"
              value={minBudget ?? ''}
              onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
              className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs outline-hidden"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Max ₦"
              value={maxBudget ?? ''}
              onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
              className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-xs outline-hidden"
            />
            {(minBudget !== undefined || maxBudget !== undefined) && (
              <button
                onClick={() => {
                  setMinBudget(undefined);
                  setMaxBudget(undefined);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold ml-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs rounded-lg border border-slate-300 px-2.5 py-1 bg-white outline-hidden font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="budgetHigh">Highest Budget (₦)</option>
              <option value="budgetLow">Lowest Budget (₦)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-600">
            Showing <span className="text-slate-900">{tasks.length}</span> digital tasks
          </span>
          {category !== 'All' && (
            <span className="text-xs text-emerald-700 font-semibold">Filtered by: {category}</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Matching Tasks Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords, budget filters, or browse a different category.
            </p>
            <button
              onClick={() => {
                setCategory('All');
                setSearchQuery('');
                setMinBudget(undefined);
                setMaxBudget(undefined);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate">
                      {task.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Deadline: {task.deadline || 'Flexible'}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          task.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'APPLICATIONS_RECEIVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setActiveTask(task)}
                    className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition cursor-pointer leading-snug"
                  >
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                    {task.description}
                  </p>

                  {task.requiredSkills && task.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {task.requiredSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Fixed Reward</span>
                      <span className="text-base font-black text-emerald-800">
                        ₦{task.budgetNgn.toLocaleString('en-NG')}
                      </span>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[10px] text-slate-400 block">Client</span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        {task.clientName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReportClick(task)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Report this task"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveTask(task)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                    >
                      View Brief
                    </button>

                    {task.status === 'OPEN' || task.status === 'APPLICATIONS_RECEIVED' ? (
                      currentUser?.uid === task.clientId ? (
                        <button
                          onClick={() => onSelectTab('my-work')}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition"
                        >
                          Manage Task
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyClick(task)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition active:scale-95"
                        >
                          <Send className="w-3 h-3" />
                          Apply Now
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-slate-400 font-medium px-2 py-1">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Slideover / Modal */}
      {activeTask && !isApplyOpen && !isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => {
                setActiveTask(null);
                onClearSelectedTask?.();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {activeTask.category}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-2 leading-snug">{activeTask.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                <span>Posted by {activeTask.clientName}</span>
                <span>•</span>
                <span>Deadline: {activeTask.deadline || 'Flexible'}</span>
                <span>•</span>
                <span className="font-bold text-emerald-800">
                  ₦{activeTask.budgetNgn.toLocaleString('en-NG')} NGN
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Briefing & Requirements</h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {activeTask.description}
              </div>
            </div>

            {activeTask.requiredSkills && activeTask.requiredSkills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeTask.requiredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTask.attachmentUrls && activeTask.attachmentUrls.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Reference Attachments
                </h4>
                <div className="space-y-1">
                  {activeTask.attachmentUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline truncate max-w-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
              <span className="font-bold">Pilot Safety Notice:</span> Payment is made directly between client and
              worker upon verified delivery. Never pay recruitment fees or share confidential banking OTPs.
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleReportClick(activeTask)}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Report Task
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTask(null);
                    onClearSelectedTask?.();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Close
                </button>
                {activeTask.clientId !== currentUser?.uid ? (
                  <button
                    onClick={() => handleApplyClick(activeTask)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Apply for ₦{activeTask.budgetNgn.toLocaleString('en-NG')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTask(null);
                      onSelectTab('my-work');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Go to My Work
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {activeTask && (
        <ApplyModal
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          task={activeTask}
          onApplied={() => {
            loadTasks();
            setActiveTask(null);
          }}
        />
      )}

      {/* Report Modal */}
      {activeTask && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="task"
          targetId={activeTask.id}
          targetTitle={activeTask.title}
        />
      )}
    </div>
  );
};
