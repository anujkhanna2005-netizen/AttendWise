import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/** Sign in with Google OAuth popup */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Sign in with email + password */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Create a new account with email + password */
export async function createAccount(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Sign out the current user */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Subscribe to auth state changes. Returns unsubscribe fn. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Get the currently signed-in user (null if not signed in) */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
