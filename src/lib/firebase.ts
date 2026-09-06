import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  deleteUser,
  reauthenticateWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import {
  AvatarConfig,
  JournalEntry,
  PanelConfig,
  UserProfile,
  WeeklyRecap,
} from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Pass custom databaseId if configured in firebase-applet-config.json
export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively strips undefined values from objects before writing to Firestore
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * User Profile Operations
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, stripUndefined(profile), { merge: true });
}

export async function saveUserAvatar(uid: string, avatarConfig: AvatarConfig): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    stripUndefined({
      avatarConfig,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true }
  );
}

/**
 * Journal Entries Operations
 * Nested under /users/{userId}/entries/{entryId} for strict owner isolation
 */
export async function saveRawJournalEntry(
  userId: string,
  entryId: string,
  content: string,
  entryDate?: string
): Promise<JournalEntry> {
  const today = new Date().toISOString().split('T')[0];
  const validEntryDate =
    entryDate && /^\d{4}-\d{2}-\d{2}$/.test(entryDate) ? entryDate : today;

  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const newEntry: JournalEntry = {
    id: entryId,
    userId,
    content,
    entryDate: validEntryDate,
    createdAt: new Date().toISOString(),
    analysisStatus: 'pending',
  };

  await setDoc(entryRef, stripUndefined(newEntry));
  return newEntry;
}

export async function updateJournalEntryContent(
  userId: string,
  entryId: string,
  content: string,
  entryDate: string,
  existingPanel?: PanelConfig | null
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const updates: Record<string, any> = {
    content,
    entryDate,
    updatedAt: new Date().toISOString(),
  };

  // When text is edited, mark panel as stale if it exists
  if (existingPanel) {
    updates.panel = {
      ...existingPanel,
      isStale: true,
    };
  }

  await updateDoc(entryRef, stripUndefined(updates));
}

export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

export async function updateEntryAnalysis(
  userId: string,
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await updateDoc(
    entryRef,
    stripUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const entries: JournalEntry[] = [];
  snap.forEach((d) => {
    const data = d.data() as JournalEntry;
    const fallbackDate = (data.createdAt || new Date().toISOString()).split('T')[0];
    entries.push({
      ...data,
      entryDate: data.entryDate || fallbackDate,
    });
  });

  // Sort primarily by entryDate desc, secondarily by createdAt desc
  entries.sort((a, b) => {
    const dateComp = (b.entryDate || '').localeCompare(a.entryDate || '');
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return entries;
}

/**
 * Weekly Recaps Operations
 * Nested under /users/{userId}/weeklyRecaps/{weekId} for strict owner isolation
 */
export async function getWeeklyRecaps(userId: string): Promise<WeeklyRecap[]> {
  const recapsRef = collection(db, 'users', userId, 'weeklyRecaps');
  const q = query(recapsRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const recaps: WeeklyRecap[] = [];
  snap.forEach((d) => {
    recaps.push(d.data() as WeeklyRecap);
  });
  return recaps;
}

export async function saveWeeklyRecap(
  userId: string,
  recap: WeeklyRecap
): Promise<void> {
  const recapRef = doc(db, 'users', userId, 'weeklyRecaps', recap.id);
  await setDoc(recapRef, stripUndefined(recap), { merge: true });
}

/**
 * Permanently deletes all user data across all Firestore subcollections
 * (entries, weeklyRecaps) and user profile document, followed by Firebase Auth account.
 * Scoped strictly to auth.currentUser.uid to prevent broken access control (OWASP A01 / Directive 14).
 */
export async function deleteUserDataAndAccount(): Promise<{
  success: boolean;
  requiresReauth?: boolean;
  error?: string;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user session found.');
  }
  const uid = currentUser.uid;

  try {
    // 1. Cascading subcollection deletion: entries
    const entriesRef = collection(db, 'users', uid, 'entries');
    const entriesSnap = await getDocs(entriesRef);
    const entryDeletions = entriesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(entryDeletions);

    // 2. Cascading subcollection deletion: weeklyRecaps
    const recapsRef = collection(db, 'users', uid, 'weeklyRecaps');
    const recapsSnap = await getDocs(recapsRef);
    const recapDeletions = recapsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(recapDeletions);

    // 3. Delete parent user profile document
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);

    // 4. Delete Firebase Auth user account
    try {
      await deleteUser(currentUser);
      return { success: true };
    } catch (authErr: any) {
      if (authErr?.code === 'auth/requires-recent-login') {
        // Prompt for re-authentication via popup, then retry account deletion
        try {
          await reauthenticateWithPopup(currentUser, googleProvider);
          await deleteUser(currentUser);
          return { success: true };
        } catch (reauthErr: any) {
          return {
            success: false,
            requiresReauth: true,
            error:
              reauthErr?.message ||
              'Sensitive operation requires recent authentication. Please sign in again to confirm deletion.',
          };
        }
      }
      return {
        success: false,
        error: authErr?.message || 'Failed to remove authentication profile.',
      };
    }
  } catch (err: any) {
    console.error('Cascading data deletion failure:', err);
    return {
      success: false,
      error: err?.message || 'An error occurred while deleting your personal journal data.',
    };
  }
}
