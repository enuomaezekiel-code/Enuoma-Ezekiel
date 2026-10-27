import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SafetyReport, TaskItem, UserProfile } from '../types';

export async function submitSafetyReport(params: {
  reporterId: string;
  reporterName: string;
  targetType: 'task' | 'user' | 'job';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
}): Promise<SafetyReport> {
  const reportsColRef = collection(db, 'reports');
  const reportDocRef = doc(reportsColRef);
  const now = new Date().toISOString();

  const report: SafetyReport = {
    ...params,
    id: reportDocRef.id,
    status: 'PENDING',
    createdAt: now,
  };

  try {
    await setDoc(reportDocRef, report);

    // If reporting a task as scam, flag it for review
    if (params.targetType === 'task') {
      try {
        await updateDoc(doc(db, 'tasks', params.targetId), {
          isFlagged: true,
        });
      } catch (e) {
        console.warn('Flagging task on report:', e);
      }
    }

    return report;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reports/${reportDocRef.id}`);
  }
}

export async function getAllReports(): Promise<SafetyReport[]> {
  try {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SafetyReport);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'reports');
  }
}

export async function updateReportStatus(
  reportId: string,
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN',
  adminNotes?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      adminNotes: adminNotes || '',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function toggleUserSuspension(userId: string, isSuspended: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isSuspended,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function toggleTaskFlag(taskId: string, isFlagged: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      isFlagged,
      status: isFlagged ? 'CANCELLED' : 'OPEN',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
  }
}

export async function getAdminPlatformMetrics(): Promise<{
  totalUsers: number;
  openTasks: number;
  pendingReports: number;
  suspendedUsers: number;
  activeDisputes: number;
  recentTasks: TaskItem[];
  recentUsers: UserProfile[];
}> {
  try {
    const usersSnap = await getDocs(query(collection(db, 'users'), limit(100)));
    const users: UserProfile[] = usersSnap.docs.map((d) => d.data() as UserProfile);

    const tasksSnap = await getDocs(query(collection(db, 'tasks'), limit(100)));
    const tasks: TaskItem[] = tasksSnap.docs.map((d) => d.data() as TaskItem);

    const reportsSnap = await getDocs(query(collection(db, 'reports'), limit(100)));
    const reports: SafetyReport[] = reportsSnap.docs.map((d) => d.data() as SafetyReport);

    const totalUsers = users.length;
    const suspendedUsers = users.filter((u) => u.isSuspended).length;
    const openTasks = tasks.filter((t) => t.status === 'OPEN' || t.status === 'APPLICATIONS_RECEIVED').length;
    const pendingReports = reports.filter((r) => r.status === 'PENDING').length;
    const activeDisputes = tasks.filter((t) => t.paymentStatus === 'Disputed').length;

    return {
      totalUsers,
      openTasks,
      pendingReports,
      suspendedUsers,
      activeDisputes,
      recentTasks: tasks.slice(0, 10),
      recentUsers: users.slice(0, 10),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'metrics');
  }
}
