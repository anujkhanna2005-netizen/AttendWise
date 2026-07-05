import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { BottomSheet } from './ui/BottomSheet';

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onClose }) => {
  const { signInGoogle, signInEmail, createEmailAccount, authError, clearAuthError, isFirebaseReady } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    clearAuthError();
    onClose();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInEmail(email, password);
      } else {
        await createEmailAccount(email, password);
      }
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInGoogle();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={mode === 'signin' ? 'Sign In' : 'Create Account'}>
      <div>
        <p className="text-xs text-outline mb-6 -mt-2">
          Your attendance data syncs across all your devices
        </p>

        {!isFirebaseReady && (
          <div className="bg-error/10 border border-error/30 rounded-token-sm p-3 mb-4 text-xs text-error text-center">
            Firebase is not yet configured. Paste your Firebase config in{' '}
            <code>src/firebase/config.ts</code> to enable cloud sync.
          </div>
        )}

        {authError && (
          <div className="bg-error/10 border border-error/30 rounded-token-sm p-3 mb-4 text-xs text-error text-center">
            {authError}
          </div>
        )}

        {isFirebaseReady && (
          <>
            {/* Google Sign-In */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-token-sm border border-outline-variant/50 bg-surface-variant/40 hover:bg-surface-variant/70 transition-all text-on-surface font-body-sm mb-4 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-outline-variant/40" />
              <span className="text-xs text-outline">or</span>
              <div className="h-px flex-1 bg-outline-variant/40" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface font-body-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full p-3 rounded-token-sm border border-outline-variant/50 bg-surface/50 text-on-surface font-body-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
                className="mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <button
              onClick={() => { clearAuthError(); setMode(m => m === 'signin' ? 'register' : 'signin'); }}
              className="w-full mt-4 text-xs text-outline hover:text-on-surface transition-colors text-center"
            >
              {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </>
        )}

        <button
          onClick={handleClose}
          className="w-full mt-4 text-xs text-outline hover:text-on-surface transition-colors text-center"
        >
          Continue without signing in
        </button>
      </div>
    </BottomSheet>
  );
};
