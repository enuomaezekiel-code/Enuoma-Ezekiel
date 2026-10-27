import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  activeRole: 'client' | 'worker';
  setActiveRole: (role: 'client' | 'worker') => void;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'kimmiyeon305@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<'client' | 'worker'>('worker');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrCreateProfile = async (user: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snapshot = await getDoc(userDocRef);
      const isSystemAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // ensure admin flag is synced if email matches system admin
        if (isSystemAdmin && !data.isAdmin) {
          await updateDoc(userDocRef, { isAdmin: true });
          data.isAdmin = true;
        }
        setUserProfile(data);
        return data;
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'Nigerian Professional',
          email: user.email || '',
          photoURL: user.photoURL || '',
          bio: 'Skilled Nigerian professional ready to deliver top quality digital work.',
          skills: ['Graphic Design', 'Data Entry'],
          location: 'Lagos, Nigeria',
          role: 'both',
          completedJobs: 0,
          rating: 5.0,
          ratingCount: 0,
          isSuspended: false,
          isAdmin: isSystemAdmin,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);

        // Also add to admins collection if system admin
        if (isSystemAdmin) {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              email: user.email,
              role: 'superadmin',
              addedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Admin record write check:', e);
          }
        }

        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await fetchOrCreateProfile(user);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchOrCreateProfile(result.user);
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out failed:', err);
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      // Protect sensitive properties from being spoofed
      const safeUpdates = { ...updates };
      delete (safeUpdates as any).isAdmin;
      delete (safeUpdates as any).uid;
      delete (safeUpdates as any).email;
      delete (safeUpdates as any).isSuspended;

      await updateDoc(userDocRef, safeUpdates);
      setUserProfile((prev) => (prev ? { ...prev, ...safeUpdates } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchOrCreateProfile(currentUser);
    }
  };

  const isAdmin =
    currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    Boolean(userProfile?.isAdmin);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        activeRole,
        setActiveRole,
        isAdmin,
        loading,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
