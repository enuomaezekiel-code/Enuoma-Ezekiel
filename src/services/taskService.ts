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
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { TaskItem, TaskStatus } from '../types';

export interface TaskFilterOptions {
  category?: string;
  searchQuery?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: 'newest' | 'budgetHigh' | 'budgetLow';
}

export async function createTask(
  data: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'status' | 'paymentStatus'>
): Promise<TaskItem> {
  const tasksColRef = collection(db, 'tasks');
  const newDocRef = doc(tasksColRef);
  const now = new Date().toISOString();

  const newTask: TaskItem = {
    ...data,
    id: newDocRef.id,
    status: 'OPEN',
    paymentStatus: 'Not Recorded',
    applicationsCount: 0,
    isFlagged: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(newDocRef, newTask);

    // Record initial creation event
    const eventRef = doc(collection(db, 'jobEvents'));
    await setDoc(eventRef, {
      id: eventRef.id,
      taskId: newTask.id,
      clientId: newTask.clientId,
      authorId: newTask.clientId,
      authorName: newTask.clientName,
      eventType: 'TASK_CREATED',
      note: `Task "${newTask.title}" created with budget ₦${newTask.budgetNgn.toLocaleString('en-NG')}.`,
      createdAt: now,
    });

    return newTask;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `tasks/${newDocRef.id}`);
  }
}

export async function getTasks(filters?: TaskFilterOptions): Promise<TaskItem[]> {
  try {
    // Query recent tasks
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(tasksQuery);

    let tasks: TaskItem[] = [];
    snapshot.forEach((d) => {
      tasks.push(d.data() as TaskItem);
    });

    // Client-side filtering for fast and rich multi-property search
    if (filters) {
      if (filters.category && filters.category !== 'All') {
        tasks = tasks.filter((t) => t.category === filters.category);
      }
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const queryTerm = filters.searchQuery.toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(queryTerm) ||
            t.description.toLowerCase().includes(queryTerm) ||
            t.requiredSkills?.some((s) => s.toLowerCase().includes(queryTerm))
        );
      }
      if (filters.minBudget !== undefined && filters.minBudget > 0) {
        tasks = tasks.filter((t) => t.budgetNgn >= (filters.minBudget || 0));
      }
      if (filters.maxBudget !== undefined && filters.maxBudget > 0) {
        tasks = tasks.filter((t) => t.budgetNgn <= (filters.maxBudget || Infinity));
      }
      if (filters.sortBy === 'budgetHigh') {
        tasks.sort((a, b) => b.budgetNgn - a.budgetNgn);
      } else if (filters.sortBy === 'budgetLow') {
        tasks.sort((a, b) => a.budgetNgn - b.budgetNgn);
      } else {
        // default newest
        tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return tasks;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'tasks');
  }
}

export async function getTaskById(taskId: string): Promise<TaskItem | null> {
  try {
    const docSnap = await getDoc(doc(db, 'tasks', taskId));
    if (!docSnap.exists()) return null;
    return docSnap.data() as TaskItem;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `tasks/${taskId}`);
  }
}

export async function getClientTasks(clientId: string): Promise<TaskItem[]> {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TaskItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'tasks');
  }
}

export async function getWorkerTasks(workerId: string): Promise<TaskItem[]> {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('assignedWorkerId', '==', workerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TaskItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'tasks');
  }
}

export async function updateTask(
  taskId: string,
  updates: Partial<TaskItem>,
  authorId: string,
  authorName: string,
  eventNote?: string
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  const now = new Date().toISOString();

  try {
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: now,
    });

    if (eventNote) {
      const eventRef = doc(collection(db, 'jobEvents'));
      await setDoc(eventRef, {
        id: eventRef.id,
        taskId,
        authorId,
        authorName,
        eventType: updates.status || 'TASK_UPDATED',
        note: eventNote,
        createdAt: now,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
  }
}
