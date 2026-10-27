import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PaymentRecord, PaymentStatus } from '../types';

export async function getPaymentRecord(taskId: string): Promise<PaymentRecord | null> {
  try {
    const snap = await getDoc(doc(db, 'paymentRecords', taskId));
    if (!snap.exists()) return null;
    return snap.data() as PaymentRecord;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `paymentRecords/${taskId}`);
  }
}

export async function updatePaymentStatus(params: {
  taskId: string;
  status: PaymentStatus;
  userRole: 'client' | 'worker' | 'admin';
  notes?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const recordRef = doc(db, 'paymentRecords', params.taskId);
  const taskRef = doc(db, 'tasks', params.taskId);

  try {
    const updatePayload: Record<string, any> = {
      status: params.status,
      updatedAt: now,
    };

    if (params.userRole === 'client' && params.notes) {
      updatePayload.clientNotes = params.notes;
    } else if (params.userRole === 'worker' && params.notes) {
      updatePayload.workerNotes = params.notes;
    }

    await updateDoc(recordRef, updatePayload);
    await updateDoc(taskRef, {
      paymentStatus: params.status,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `paymentRecords/${params.taskId}`);
  }
}
