import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  RotateCcw,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Banknote,
  ShieldAlert,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  TaskItem,
  TaskApplication,
  JobSubmission,
  PaymentStatus,
  TaskStatus,
} from '../types';
import { getClientTasks, getWorkerTasks } from '../services/taskService';
import {
  getApplicationsForTask,
  getWorkerApplications,
  selectWorkerForTask,
} from '../services/applicationService';
import {
  getSubmissionForTask,
  submitWork,
  requestRevision,
  approveWork,
} from '../services/submissionService';
import { updatePaymentStatus } from '../services/paymentService';
import { ReviewModal } from '../components/ReviewModal';
import { ReportModal } from '../components/ReportModal';

interface MyWorkViewProps {
  onSelectTab: (tab: string) => void;
}

export const MyWorkView: React.FC<MyWorkViewProps> = ({ onSelectTab }) => {
  const { currentUser, userProfile, activeRole, setActiveRole } = useAuth();

  // Mode: Client Workspace vs Worker Workspace
  const [workspaceMode, setWorkspaceMode] = useState<'client' | 'worker'>(activeRole);

  useEffect(() => {
    setWorkspaceMode(activeRole);
  }, [activeRole]);

  // Client Data
  const [clientTasks, setClientTasks] = useState<TaskItem[]>([]);
  const [selectedTaskApplications, setSelectedTaskApplications] = useState<{
    taskId: string;
    apps: TaskApplication[];
  } | null>(null);

  // Worker Data
  const [workerTasks, setWorkerTasks] = useState<TaskItem[]>([]);
  const [workerApplications, setWorkerApplications] = useState<TaskApplication[]>([]);

  // Submissions map
  const [submissions, setSubmissions] = useState<Record<string, JobSubmission>>({});

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Modals
  const [revisionModalTask, setRevisionModalTask] = useState<TaskItem | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  const [submitDeliverableTask, setSubmitDeliverableTask] = useState<TaskItem | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');

  const [reviewTask, setReviewTask] = useState<{
    task: TaskItem;
    targetUserId: string;
    targetUserName: string;
    roleReviewed: 'client' | 'worker';
  } | null>(null);

  const [disputeTask, setDisputeTask] = useState<TaskItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadWorkspaceData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (workspaceMode === 'client') {
        const tasks = await getClientTasks(currentUser.uid);
        setClientTasks(tasks);

        // Load submissions for active/submitted client tasks
        const subMap: Record<string, JobSubmission> = {};
        for (const t of tasks) {
          if (t.status === 'SUBMITTED' || t.status === 'REVISION_REQUESTED' || t.status === 'COMPLETED') {
            const sub = await getSubmissionForTask(t.id);
            if (sub) subMap[t.id] = sub;
          }
        }
        setSubmissions(subMap);
      } else {
        const [hiredTasks, apps] = await Promise.all([
          getWorkerTasks(currentUser.uid),
          getWorkerApplications(currentUser.uid),
        ]);
        setWorkerTasks(hiredTasks);
        setWorkerApplications(apps);

        // Load submissions for hired tasks
        const subMap: Record<string, JobSubmission> = {};
        for (const t of hiredTasks) {
          const sub = await getSubmissionForTask(t.id);
          if (sub) subMap[t.id] = sub;
        }
        setSubmissions(subMap);
      }
    } catch (err) {
      console.error('Error loading workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceMode, currentUser]);

  // Client Actions: Load applications for a task
  const handleToggleApplications = async (taskId: string) => {
    if (selectedTaskApplications?.taskId === taskId) {
      setSelectedTaskApplications(null);
      return;
    }
    setActionLoading(true);
    try {
      const apps = await getApplicationsForTask(taskId);
      setSelectedTaskApplications({ taskId, apps });
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Client Action: Select / Hire Worker
  const handleSelectWorker = async (task: TaskItem, app: TaskApplication) => {
    if (!currentUser) return;
    const confirmHire = window.confirm(
      `Hire ${app.workerName} for ₦${app.bidAmountNgn.toLocaleString('en-NG')}? Task will move to IN PROGRESS.`
    );
    if (!confirmHire) return;

    setActionLoading(true);
    try {
      await selectWorkerForTask({
        taskId: task.id,
        applicationId: app.id,
        clientId: currentUser.uid,
        clientName: userProfile?.displayName || currentUser.displayName || 'Client',
        workerId: app.workerId,
        workerName: app.workerName,
        agreedAmountNgn: app.bidAmountNgn,
      });
      showToast(`Hired ${app.workerName}! Task is now In Progress.`);
      setSelectedTaskApplications(null);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || 'Failed to hire worker.');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Action: Approve Work
  const handleApproveWork = async (task: TaskItem) => {
    if (!currentUser || !task.assignedWorkerId) return;
    const confirmApprove = window.confirm(
      'Approve work and mark task as COMPLETED? You can now transfer funds directly in NGN and leave a review.'
    );
    if (!confirmApprove) return;

    setActionLoading(true);
    try {
      await approveWork({
        taskId: task.id,
        clientId: currentUser.uid,
        clientName: userProfile?.displayName || currentUser.displayName || 'Client',
        workerId: task.assignedWorkerId,
        workerName: task.assignedWorkerName || 'Worker',
      });
      showToast('Work approved! Task completed.');
      await loadWorkspaceData();

      // Prompt review modal
      setReviewTask({
        task,
        targetUserId: task.assignedWorkerId,
        targetUserName: task.assignedWorkerName || 'Worker',
        roleReviewed: 'worker',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to approve work.');
    } finally {
      setActionLoading(false);
    }
  };

  // Client Action: Request Revision
  const handleRequestRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalTask || !currentUser || !revisionModalTask.assignedWorkerId) return;
    if (!revisionFeedback.trim()) {
      alert('Please provide specific revision instructions.');
      return;
    }

    setActionLoading(true);
    try {
      await requestRevision({
        taskId: revisionModalTask.id,
        clientId: currentUser.uid,
        clientName: userProfile?.displayName || currentUser.displayName || 'Client',
        workerId: revisionModalTask.assignedWorkerId,
        feedback: revisionFeedback.trim(),
      });
      showToast('Revision requested. The worker has been notified.');
      setRevisionModalTask(null);
      setRevisionFeedback('');
      await loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || 'Failed to request revision.');
    } finally {
      setActionLoading(false);
    }
  };

  // Worker Action: Submit Deliverable
  const handleSubmitDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitDeliverableTask || !currentUser) return;
    if (!submissionNotes.trim()) {
      alert('Please provide notes describing your deliverable.');
      return;
    }

    setActionLoading(true);
    try {
      await submitWork({
        taskId: submitDeliverableTask.id,
        clientId: submitDeliverableTask.clientId,
        workerId: currentUser.uid,
        workerName: userProfile?.displayName || currentUser.displayName || 'Worker',
        submissionNotes: submissionNotes.trim(),
        deliverableUrl: deliverableUrl.trim() || undefined,
      });
      showToast('Deliverable submitted to client for approval!');
      setSubmitDeliverableTask(null);
      setSubmissionNotes('');
      setDeliverableUrl('');
      await loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit work.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Payment Status
  const handleUpdatePaymentStatus = async (
    taskId: string,
    newStatus: PaymentStatus,
    role: 'client' | 'worker',
    note?: string
  ) => {
    setActionLoading(true);
    try {
      await updatePaymentStatus({
        taskId,
        status: newStatus,
        userRole: role,
        notes: note,
      });
      showToast(`Payment status updated to "${newStatus}".`);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Dual Workspace Toggle */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Work Management Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track applications, review deliverables, request revisions, and monitor direct NGN payments.
          </p>
        </div>

        {/* Workspace Mode Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setWorkspaceMode('client');
              setActiveRole('client');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              workspaceMode === 'client'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Client Mode (I'm Hiring)
          </button>
          <button
            onClick={() => {
              setWorkspaceMode('worker');
              setActiveRole('worker');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              workspaceMode === 'worker'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Worker Mode (I'm Freelancing)
          </button>
        </div>
      </div>

      {/* Direct Pilot Payment Advisory Box */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
        <Banknote className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-900">TaskNaija Pilot Payment Guidance:</span>
          <p className="text-emerald-800 leading-relaxed">
            During this pilot, all payments are settled directly between client & worker (e.g., Nigerian Bank Transfer,
            Opay, PalmPay, Kuda) upon verified delivery. TaskNaija provides transparent status tracking and a mutual
            review audit.
          </p>
        </div>
      </div>

      {/* CLIENT WORKSPACE */}
      {workspaceMode === 'client' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              My Posted Tasks ({clientTasks.length})
            </h2>
            <button
              onClick={() => onSelectTab('post-task')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
            >
              + Post Another Task
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : clientTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">You Haven't Posted Any Tasks Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need graphic design, typing, video editing, or tech help? Post your task to start receiving proposals.
              </p>
              <button
                onClick={() => onSelectTab('post-task')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
              >
                Post Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clientTasks.map((task) => {
                const sub = submissions[task.id];
                const isAppsOpen = selectedTaskApplications?.taskId === task.id;

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {task.category}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              task.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'SUBMITTED'
                                ? 'bg-amber-100 text-amber-800'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Status: {task.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="font-extrabold text-emerald-800">
                            Reward: ₦{task.budgetNgn.toLocaleString('en-NG')}
                          </span>
                          <span>•</span>
                          <span>Deadline: {task.deadline || 'Flexible'}</span>
                          {task.assignedWorkerName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-800 font-semibold flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Hired: {task.assignedWorkerName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Status</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md inline-block mt-0.5 ${
                            task.paymentStatus === 'Payment Confirmed by Both Parties'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.paymentStatus === 'Disputed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {task.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Applications Section for Open Tasks */}
                    {(task.status === 'OPEN' || task.status === 'APPLICATIONS_RECEIVED') && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleToggleApplications(task.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                        >
                          {isAppsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isAppsOpen ? 'Hide Worker Proposals' : 'Review Worker Proposals'}
                        </button>

                        {isAppsOpen && (
                          <div className="mt-3 space-y-2.5 pl-2 border-l-2 border-emerald-500">
                            {actionLoading ? (
                              <p className="text-xs text-slate-400">Loading worker proposals...</p>
                            ) : selectedTaskApplications?.apps.length === 0 ? (
                              <p className="text-xs text-slate-500 italic">
                                No proposals submitted yet. Freelancers browse new tasks daily.
                              </p>
                            ) : (
                              selectedTaskApplications?.apps.map((app) => (
                                <div
                                  key={app.id}
                                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-xs">
                                        {(app.workerName?.[0] || 'W').toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-slate-900">{app.workerName}</h4>
                                        <span className="text-[10px] text-slate-500">
                                          {app.workerCompletedJobs || 0} jobs completed on TaskNaija
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-black text-emerald-800">
                                        ₦{app.bidAmountNgn.toLocaleString('en-NG')}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block">in {app.proposedDays} days</span>
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    "{app.pitch}"
                                  </p>

                                  {app.workerSkills && app.workerSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {app.workerSkills.map((s, i) => (
                                        <span
                                          key={i}
                                          className="text-[9px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {app.status === 'PENDING' && (
                                    <div className="pt-2 flex justify-end">
                                      <button
                                        onClick={() => handleSelectWorker(task, app)}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs transition"
                                      >
                                        Hire This Worker
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deliverable Review Section for Submitted Work */}
                    {sub && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            Submitted Deliverable from Worker
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(sub.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                          {sub.submissionNotes}
                        </p>

                        {sub.deliverableUrl && (
                          <a
                            href={sub.deliverableUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Attached Deliverable Link
                          </a>
                        )}

                        {sub.revisionFeedback && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                            <span className="font-bold block">Previous Revision Request:</span>
                            {sub.revisionFeedback}
                          </div>
                        )}

                        {/* Client Actions on Deliverable */}
                        {task.status === 'SUBMITTED' && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            <button
                              onClick={() => {
                                setRevisionModalTask(task);
                                setRevisionFeedback('');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Request Revision
                            </button>
                            <button
                              onClick={() => handleApproveWork(task)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve Work & Complete
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Direct Payment Tracker Controls for Completed / In-Progress Tasks */}
                    {task.assignedWorkerId && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">Direct Payment Status (NGN):</span>
                          <span className="text-slate-500 ml-2">
                            {task.paymentStatus === 'Not Recorded'
                              ? 'Payment terms agreed.'
                              : task.paymentStatus === 'Payment Reported'
                              ? 'Payment was reported sent.'
                              : task.paymentStatus === 'Payment Confirmed by Both Parties'
                              ? 'Both parties confirmed settlement.'
                              : task.paymentStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {task.paymentStatus !== 'Payment Confirmed by Both Parties' && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdatePaymentStatus(
                                    task.id,
                                    'Payment Reported',
                                    'client',
                                    'Client transferred funds via bank transfer.'
                                  )
                                }
                                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100"
                              >
                                Mark Payment Sent
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdatePaymentStatus(
                                    task.id,
                                    'Payment Confirmed by Both Parties',
                                    'client',
                                    'Settled.'
                                  )
                                }
                                className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                              >
                                Confirm Settled
                              </button>
                            </>
                          )}
                          {task.status === 'COMPLETED' && (
                            <button
                              onClick={() =>
                                setReviewTask({
                                  task,
                                  targetUserId: task.assignedWorkerId!,
                                  targetUserName: task.assignedWorkerName || 'Worker',
                                  roleReviewed: 'worker',
                                })
                              }
                              className="px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center gap-1"
                            >
                              <Star className="w-3 h-3 fill-white" />
                              Review Worker
                            </button>
                          )}
                          <button
                            onClick={() => setDisputeTask(task)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Dispute job"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WORKER WORKSPACE */}
      {workspaceMode === 'worker' && (
        <div className="space-y-6">
          {/* Active Hired Tasks */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Active Hired Jobs ({workerTasks.length})
            </h2>

            {loading ? (
              <div className="h-28 bg-white rounded-2xl animate-pulse border border-slate-200" />
            ) : workerTasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-xs font-bold text-slate-900">No Active Hired Jobs</h3>
                <p className="text-xs text-slate-500">
                  Submit proposals to open tasks to get selected by Nigerian clients.
                </p>
                <button
                  onClick={() => onSelectTab('find-tasks')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Browse Open Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {workerTasks.map((task) => {
                  const sub = submissions[task.id];
                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {task.category}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                task.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : task.status === 'REVISION_REQUESTED'
                                  ? 'bg-amber-100 text-amber-900 font-bold'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {task.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{task.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="font-extrabold text-emerald-800">
                              Agreed Reward: ₦{task.budgetNgn.toLocaleString('en-NG')}
                            </span>
                            <span>•</span>
                            <span>Client: {task.clientName}</span>
                            <span>•</span>
                            <span>Deadline: {task.deadline || 'Flexible'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment</span>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 block mt-0.5">
                            {task.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Brief preview */}
                      <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed border border-slate-100">
                        <span className="font-bold block text-slate-800 mb-0.5">Task Requirements:</span>
                        {task.description}
                      </div>

                      {/* Revision notice if requested */}
                      {task.status === 'REVISION_REQUESTED' && sub?.revisionFeedback && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                          <span className="font-bold flex items-center gap-1 text-amber-950">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                            Client Requested Changes:
                          </span>
                          <p className="leading-relaxed">{sub.revisionFeedback}</p>
                        </div>
                      )}

                      {/* Deliverable submission status / button */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        {sub ? (
                          <div className="text-xs text-slate-600">
                            Deliverable submitted on {new Date(sub.updatedAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">Deliverable pending submission</div>
                        )}

                        <div className="flex items-center gap-2">
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setSubmitDeliverableTask(task);
                                setSubmissionNotes(sub?.submissionNotes || '');
                                setDeliverableUrl(sub?.deliverableUrl || '');
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {sub ? 'Update Deliverable' : 'Submit Finished Work'}
                            </button>
                          )}

                          {task.status === 'COMPLETED' && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdatePaymentStatus(
                                    task.id,
                                    'Payment Confirmed by Both Parties',
                                    'worker',
                                    'Worker confirmed receipt of funds.'
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200"
                              >
                                Confirm Bank Receipt
                              </button>
                              <button
                                onClick={() =>
                                  setReviewTask({
                                    task,
                                    targetUserId: task.clientId,
                                    targetUserName: task.clientName,
                                    roleReviewed: 'client',
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center gap-1"
                              >
                                <Star className="w-3 h-3 fill-white" />
                                Review Client
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Worker's Submitted Proposals */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              My Submitted Proposals ({workerApplications.length})
            </h2>

            {workerApplications.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-500">
                You haven't submitted any proposals yet. Check the "Find Tasks" tab to apply.
              </div>
            ) : (
              <div className="space-y-2.5">
                {workerApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{app.taskTitle || 'Digital Task'}</span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                            app.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-slate-500 line-clamp-1 italic">"{app.pitch}"</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-800 text-xs">
                        ₦{app.bidAmountNgn.toLocaleString('en-NG')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{app.proposedDays} days turnaround</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Request Revision */}
      {revisionModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request Revision from Worker</h3>
            <p className="text-xs text-slate-500">
              Provide clear, constructive feedback on what adjustments are needed to meet the briefing requirements.
            </p>
            <form onSubmit={handleRequestRevisionSubmit} className="space-y-3">
              <textarea
                rows={4}
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="e.g. Please change the font to Poppins, adjust the color palette to darker green, and supply the high-res PNG format..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50 resize-none"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalTask(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Revision Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Worker Submit Deliverable */}
      {submitDeliverableTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Submit Completed Deliverable</h3>
            <p className="text-xs text-slate-500">
              Deliver your work files, links, and explanation. The client will review and approve.
            </p>
            <form onSubmit={handleSubmitDeliverableSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable Description & Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Summarize the completed deliverables, file specs, and any recommendations..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deliverable Link (Google Drive, Dropbox, Figma, GitHub)
                </label>
                <input
                  type="url"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitDeliverableTask(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Review */}
      {reviewTask && (
        <ReviewModal
          isOpen={true}
          onClose={() => setReviewTask(null)}
          taskId={reviewTask.task.id}
          targetUserId={reviewTask.targetUserId}
          targetUserName={reviewTask.targetUserName}
          roleReviewed={reviewTask.roleReviewed}
          onReviewSubmitted={() => {
            showToast('Review submitted!');
            loadWorkspaceData();
          }}
        />
      )}

      {/* MODAL: Dispute Job */}
      {disputeTask && (
        <ReportModal
          isOpen={true}
          onClose={() => setDisputeTask(null)}
          targetType="job"
          targetId={disputeTask.id}
          targetTitle={disputeTask.title}
        />
      )}
    </div>
  );
};
