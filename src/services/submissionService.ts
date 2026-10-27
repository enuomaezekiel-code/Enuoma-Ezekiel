import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { JobEvent, JobSubmission, TaskStatus } from '../types';

export async function submitWork(params: {
  taskId: string;
  clientId: string;
  workerId: string;
  workerName: string;
  submissionNotes: string;
  deliverableUrl?: string;
}): Promise<JobSubmission> {
  const now = new Date().toISOString();
  const subDocRef = doc(db, 'jobSubmissions', params.taskId);

  const submission: JobSubmission = {
    id: params.taskId,
    taskId: params.taskId,
    clientId: params.clientId,
    workerId: params.workerId,
    submissionNotes: params.submissionNotes,
    deliverableUrl: params.deliverableUrl || '',
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(subDocRef, submission);

    // Update Task status
    await updateDoc(doc(db, 'tasks', params.taskId), {
      status: 'SUBMITTED',
      updatedAt: now,
    });

    // Record Event
    const eventRef = doc(collection(db, 'jobEvents'));
    await setDoc(eventRef, {
      id: eventRef.id,
      taskId: params.taskId,
      clientId: params.clientId,
      workerId: params.workerId,
      authorId: params.workerId,
      authorName: params.workerName,
      eventType: 'WORK_SUBMITTED',
      note: `${params.workerName} submitted work deliverables for review: "${params.submissionNotes.slice(0, 100)}..."`,
      createdAt: now,
    });

    return submission;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `jobSubmissions/${params.taskId}`);
  }
}

export async function requestRevision(params: {
  taskId: string;
  clientId: string;
  clientName: string;
  workerId: string;
  feedback: string;
}): Promise<void> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'jobSubmissions', params.taskId), {
      revisionFeedback: params.feedback,
      status: 'REVISION_REQUESTED',
      updatedAt: now,
    });

    await updateDoc(doc(db, 'tasks', params.taskId), {
      status: 'REVISION_REQUESTED',
      updatedAt: now,
    });

    // Record Event
    const eventRef = doc(collection(db, 'jobEvents'));
    await setDoc(eventRef, {
      id: eventRef.id,
      taskId: params.taskId,
      clientId: params.clientId,
      workerId: params.workerId,
      authorId: params.clientId,
      authorName: params.clientName,
      eventType: 'REVISION_REQUESTED',
      note: `Client requested changes: "${params.feedback}"`,
      createdAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tasks/${params.taskId}`);
  }
}

export async function approveWork(params: {
  taskId: string;
  clientId: string;
  clientName: string;
  workerId: string;
  workerName: string;
}): Promise<void> {
  const now = new Date().toISOString();
  try {
    // 1. Mark submission approved
    await updateDoc(doc(db, 'jobSubmissions', params.taskId), {
      status: 'APPROVED',
      updatedAt: now,
    });

    // 2. Mark task COMPLETED
    await updateDoc(doc(db, 'tasks', params.taskId), {
      status: 'COMPLETED',
      updatedAt: now,
    });

    // 3. Increment worker's completedJobs in their user profile
    try {
      await updateDoc(doc(db, 'users', params.workerId), {
        completedJobs: increment(1),
      });
    } catch (e) {
      console.warn('Completed job counter update:', e);
    }

    // 4. Record Event
    const eventRef = doc(collection(db, 'jobEvents'));
    await setDoc(eventRef, {
      id: eventRef.id,
      taskId: params.taskId,
      clientId: params.clientId,
      workerId: params.workerId,
      authorId: params.clientId,
      authorName: params.clientName,
      eventType: 'WORK_APPROVED',
      note: `Work approved! Task is successfully completed. Client can now proceed with direct payment & mutual review.`,
      createdAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tasks/${params.taskId}`);
  }
}

export async function getSubmissionForTask(taskId: string): Promise<JobSubmission | null> {
  try {
    const snap = await getDoc(doc(db, 'jobSubmissions', taskId));
    if (!snap.exists()) return null;
    return snap.data() as JobSubmission;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `jobSubmissions/${taskId}`);
  }
}

export async function getJobEvents(taskId: string): Promise<JobEvent[]> {
  try {
    const q = query(
      collection(db, 'jobEvents'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as JobEvent);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'jobEvents');
  }
}
