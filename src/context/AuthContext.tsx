import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, signInWithEmail, createAccount, signOut } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  isFirebaseReady: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  createEmailAccount: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isFirebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!isFirebaseReady) {
      // Firebase not yet configured — skip auth listener, run in guest mode
      setAuthLoading(false);
      return;
    }

    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, [isFirebaseReady]);

  const signInGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : 'Google sign-in failed');
    }
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmail(email, password);
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : 'Sign-in failed');
    }
  }, []);

  const createEmailAccount = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await createAccount(email, password);
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : 'Account creation failed');
    }
  }, []);

  const logOut = useCallback(async () => {
    setAuthError(null);
    try {
      await signOut();
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : 'Sign-out failed');
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isFirebaseReady,
      signInGoogle,
      signInEmail,
      createEmailAccount,
      logOut,
      authError,
      clearAuthError,
    }),
    [user, authLoading, isFirebaseReady, signInGoogle, signInEmail, createEmailAccount, logOut, authError, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
