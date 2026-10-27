import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Layers,
  AlertTriangle,
  UserX,
  UserCheck,
  CheckCircle2,
  Trash2,
  Ban,
  ArrowLeft,
  RefreshCw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SafetyReport, TaskItem, UserProfile } from '../types';
import {
  getAllReports,
  getAdminPlatformMetrics,
  updateReportStatus,
  toggleUserSuspension,
  toggleTaskFlag,
} from '../services/trustService';

interface AdminViewProps {
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const { currentUser, isAdmin } = useAuth();

  const [metrics, setMetrics] = useState<{
    totalUsers: number;
    openTasks: number;
    pendingReports: number;
    suspendedUsers: number;
    activeDisputes: number;
    recentTasks: TaskItem[];
    recentUsers: UserProfile[];
  } | null>(null);

  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState<Record<string, string>>({});

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [m, r] = await Promise.all([getAdminPlatformMetrics(), getAllReports()]);
      setMetrics(m);
      setReports(r);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Restricted Admin Access</h2>
        <p className="text-xs text-slate-500">
          This moderation console is restricted to TaskNaija platform security administrators.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const handleReportAction = async (
    report: SafetyReport,
    newStatus: 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN'
  ) => {
    setActionLoading(true);
    try {
      const notes = adminNoteInput[report.id] || 'Processed by Administrator';
      await updateReportStatus(report.id, newStatus, notes);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserSuspension = async (userId: string, currentSuspended: boolean) => {
    const confirm = window.confirm(
      `${currentSuspended ? 'Unsuspend' : 'Suspend'} this user account? Suspended users cannot post tasks or apply.`
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      await toggleUserSuspension(userId, !currentSuspended);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle suspension.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTaskFlag = async (taskId: string, currentFlagged: boolean) => {
    const confirm = window.confirm(
      `${currentFlagged ? 'Unflag and reopen' : 'Flag and remove'} this task from public marketplace?`
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      await toggleTaskFlag(taskId, !currentFlagged);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle task flag.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
              Admin Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Trust, Safety & Moderation Console</h1>
          <p className="text-xs text-slate-300">
            Real-time platform metrics, report queue review, account suspensions, and fraud mitigation.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading || actionLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Total Users</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics?.totalUsers ?? 0}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Open Tasks</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{metrics?.openTasks ?? 0}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Pending Reports</span>
          </div>
          <span className="text-2xl font-black text-rose-600">{metrics?.pendingReports ?? 0}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <UserX className="w-4 h-4 text-amber-600" />
            <span>Suspended</span>
          </div>
          <span className="text-2xl font-black text-amber-700">{metrics?.suspendedUsers ?? 0}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <span>Job Disputes</span>
          </div>
          <span className="text-2xl font-black text-blue-900">{metrics?.activeDisputes ?? 0}</span>
        </div>
      </div>

      {/* Reports Queue */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Safety Reports Awaiting Review</h2>
            <p className="text-xs text-slate-500">
              Community flags for scams, registration fees, academic cheating, and disputes.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">{reports.length} total reports</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            No safety reports filed. Community standards are well-maintained.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                        report.status === 'PENDING'
                          ? 'bg-rose-100 text-rose-800'
                          : report.status === 'ACTION_TAKEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="font-bold text-slate-900 capitalize">
                      {report.targetType}: {report.targetTitle}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Reported by {report.reporterName} • {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-rose-800 block">Reason: {report.reason}</span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{report.details}</p>
                </div>

                {report.adminNotes && (
                  <div className="text-[11px] text-slate-500 bg-amber-50 p-2 rounded-md border border-amber-200">
                    <span className="font-bold">Admin Resolution:</span> {report.adminNotes}
                  </div>
                )}

                {/* Admin Action Bar */}
                {report.status === 'PENDING' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Add admin resolution notes..."
                      value={adminNoteInput[report.id] || ''}
                      onChange={(e) =>
                        setAdminNoteInput({ ...adminNoteInput, [report.id]: e.target.value })
                      }
                      className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg outline-hidden bg-white"
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReportAction(report, 'DISMISSED')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-200"
                      >
                        Dismiss
                      </button>

                      {report.targetType === 'user' && (
                        <button
                          onClick={() => handleToggleUserSuspension(report.targetId, false)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
                        >
                          Suspend User
                        </button>
                      )}

                      {report.targetType === 'task' && (
                        <button
                          onClick={() => handleToggleTaskFlag(report.targetId, false)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
                        >
                          Remove Task
                        </button>
                      )}

                      <button
                        onClick={() => handleReportAction(report, 'ACTION_TAKEN')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                      >
                        Resolve Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Users Moderation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">User Accounts Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Jobs Completed</th>
                <th className="p-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.recentUsers?.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{u.displayName}</span>
                    <span className="text-[10px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">{u.completedJobs || 0}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleUserSuspension(u.uid, Boolean(u.isSuspended))}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        u.isSuspended
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Tasks Moderation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Marketplace Task Moderation</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Task Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.recentTasks?.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block truncate max-w-xs">{t.title}</span>
                    <span className="text-[10px] text-slate-400">Client: {t.clientName}</span>
                  </td>
                  <td className="p-3">{t.category}</td>
                  <td className="p-3 font-bold text-emerald-800">
                    ₦{t.budgetNgn.toLocaleString('en-NG')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        t.isFlagged ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.isFlagged ? 'Flagged/Removed' : t.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleTaskFlag(t.id, Boolean(t.isFlagged))}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        t.isFlagged
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {t.isFlagged ? 'Restore' : 'Flag & Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
