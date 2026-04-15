import { useState } from 'react';
import { useAuth } from '../auth/useAuth';

interface AuthScreenProps {
  displayMode?: 'page' | 'modal';
  onClose?: () => void;
}

export default function AuthScreen({ displayMode = 'page', onClose }: AuthScreenProps) {
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(trimmedEmail, password);
      } else {
        const result = await signUp(trimmedEmail, password);
        if (!result.sessionCreated) {
          setMode('signin');
          setPassword('');
          setStatus(
            'Account created, but Supabase email confirmation is enabled. Disable "Confirm email" in Supabase Auth settings for immediate sign-in.'
          );
        }
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Authentication failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const authCard = (
    <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6">
      {displayMode === 'modal' && onClose && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Close
          </button>
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image Bookmarker</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Sign in to access your bookmarks.
      </p>

      {!isConfigured && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your env file.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading || !isConfigured}
            required
          />
        </div>

        <div>
          <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            placeholder="••••••••"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            disabled={loading || !isConfigured}
            minLength={6}
            required
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
        )}
        {status && (
          <div className="text-sm text-emerald-600 dark:text-emerald-300">{status}</div>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 text-white font-medium"
          disabled={loading || !isConfigured}
        >
          {loading
            ? mode === 'signin'
              ? 'Signing in...'
              : 'Creating account...'
            : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
            setError(null);
            setStatus(null);
          }}
          className="text-blue-600 dark:text-blue-300 hover:underline"
          disabled={loading || !isConfigured}
        >
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </div>
    </div>
  );

  if (displayMode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        {authCard}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      {authCard}
    </div>
  );
}
