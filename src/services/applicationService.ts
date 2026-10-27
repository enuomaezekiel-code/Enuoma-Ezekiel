import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { TaskApplication } from '../types';

export async function submitApplication(data: {
  taskId: string;
  taskTitle: string;
  clientId: string;
  workerId: string;
  workerName: string;
  workerPhoto?: string;
  workerBio?: string;
  workerSkills: string[];
  workerCompletedJobs?: number;
  pitch: string;
  proposedDays: number;
  bidAmountNgn: number;
}): Promise<TaskApplication> {
  if (data.clientId === data.workerId) {
    throw new Error('You cannot apply to your own posted task.');
  }

  // Check if already applied
  try {
    const existingQ = query(
      collection(db, 'applications'),
      where('taskId', '==', data.taskId),
      where('workerId', '==', data.workerId)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      throw new Error('You have already applied to this task.');
    }
  } catch (err: any) {
    if (err.message?.includes('already applied')) throw err;
    // Otherwise continue
  }

  const appColRef = collection(db, 'applications');
  const appDocRef = doc(appColRef);
  const now = new Date().toISOString();

  const application: TaskApplication = {
    ...data,
    id: appDocRef.id,
    status: 'PENDING',
    createdAt: now,
  };

  try {
    await setDoc(appDocRef, application);

    // Update task's applications count and status if OPEN
    const taskRef = doc(db, 'tasks', data.taskId);
    await updateDoc(taskRef, {
      status: 'APPLICATIONS_RECEIVED',
      updatedAt: now,
    });

    // Record Event
    const eventRef = doc(collection(db, 'jobEvents'));
    await setDoc(eventRef, {
      id: eventRef.id,
      taskId: data.taskId,
      clientId: data.clientId,
      workerId: data.workerId,
      authorId: data.workerId,
      authorName: data.workerName,
      eventType: 'APPLICATION_SUBMITTED',
      note: `${data.workerName} applied with proposal (₦${data.bidAmountNgn.toLocaleString('en-NG')}, ${data.proposedDays} days).`,
      createdAt: now,
    });

    return application;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `applications/${appDocRef.id}`);
  }
}

export async function getApplicationsForTask(taskId: string): Promise<TaskApplication[]> {
  try {
    const q = query(
      collection(db, 'applications'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TaskApplication);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'applications');
  }
}

export async function getWorkerApplications(workerId: string): Promise<TaskApplication[]> {
  try {
    const q = query(
      collection(db, 'applications'),
      where('workerId', '==', workerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TaskApplication);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'applications');
  }
}

export async function selectWorkerForTask(params: {
  taskId: string;
  applicationId: string;
  clientId: string;
  clientName: string;
  workerId: string;
  workerName: string;
  agreedAmountNgn: number;
}): Promise<void> {
  const now = new Date().toISOString();
  try {
    // 1. Accept the selected application
    await updateDoc(doc(db, 'applications', params.applicationId), {
      status: 'ACCEPTED',
    });

    // 2. Update task state to IN_PROGRESS and assign worker
    await updateDoc(doc(db, 'tasks', params.taskId), {
      status: 'IN_PROGRESS',
      assignedWorkerId: params.workerId,
      assignedWorkerName: params.workerName,
      paymentStatus: 'Payment Agreed',
      updatedAt: now,
    });

    // 3. Initialize Payment Record (Direct Pilot tracking)
    const paymentRecordRef = doc(db, 'paymentRecords', params.taskId);
    await setDoc(paymentRecordRef, {
      id: params.taskId,
      taskId: params.taskId,
      clientId: params.clientId,
      workerId: params.workerId,
      amountNgn: params.agreedAmountNgn,
      platformCommissionPercent: 10, // Pilot placeholder (0% collected in pilot)
      status: 'Payment Agreed',
      clientNotes: `Hired ${params.workerName} for ₦${params.agreedAmountNgn.toLocaleString('en-NG')}. Payment will be settled directly upon satisfactory delivery.`,
      workerNotes: 'Agreed on terms. Ready to deliver.',
      updatedAt: now,
    });

    // 4. Record JobEvent
    const eventRef = doc(collection(db, 'jobEvents'));
    await setDoc(eventRef, {
      id: eventRef.id,
      taskId: params.taskId,
      clientId: params.clientId,
      workerId: params.workerId,
      authorId: params.clientId,
      authorName: params.clientName,
      eventType: 'WORKER_SELECTED',
      note: `Client hired ${params.workerName}. Job is now IN PROGRESS. Payment terms set at ₦${params.agreedAmountNgn.toLocaleString('en-NG')}.`,
      createdAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tasks/${params.taskId}`);
  }
}
