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
import { UserReview } from '../types';

export async function submitReview(params: {
  taskId: string;
  authorId: string;
  authorName: string;
  targetUserId: string;
  roleReviewed: 'client' | 'worker';
  rating: number; // 1 to 5
  comment: string;
}): Promise<UserReview> {
  // Prevent duplicate review for same taskId and authorId
  try {
    const existingQ = query(
      collection(db, 'reviews'),
      where('taskId', '==', params.taskId),
      where('authorId', '==', params.authorId)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      throw new Error('You have already submitted a review for this job.');
    }
  } catch (err: any) {
    if (err.message?.includes('already submitted')) throw err;
  }

  const reviewColRef = collection(db, 'reviews');
  const reviewDocRef = doc(reviewColRef);
  const now = new Date().toISOString();

  const review: UserReview = {
    ...params,
    id: reviewDocRef.id,
    createdAt: now,
  };

  try {
    await setDoc(reviewDocRef, review);

    // Recalculate average rating for the target user from real reviews
    const userReviewsQuery = query(
      collection(db, 'reviews'),
      where('targetUserId', '==', params.targetUserId)
    );
    const snap = await getDocs(userReviewsQuery);
    let totalScore = 0;
    let count = 0;
    snap.forEach((d) => {
      const r = d.data() as UserReview;
      totalScore += r.rating;
      count += 1;
    });

    const averageRating = count > 0 ? Number((totalScore / count).toFixed(1)) : params.rating;

    // Update target user's profile
    await updateDoc(doc(db, 'users', params.targetUserId), {
      rating: averageRating,
      ratingCount: count,
    });

    return review;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewDocRef.id}`);
  }
}

export async function getUserReviews(userId: string): Promise<UserReview[]> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('targetUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserReview);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'reviews');
  }
}
