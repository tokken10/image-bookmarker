import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  userEmail?: string;
  onSignOut?: () => Promise<void>;
  onLogIn?: () => void;
}

export default function Header({ userEmail, onSignOut, onLogIn }: HeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!onSignOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await onSignOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {userEmail && (
            <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-300">
              {userEmail}
            </span>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 text-xs font-medium text-gray-800 dark:text-gray-100"
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          )}
          {!onSignOut && onLogIn && (
            <button
              type="button"
              onClick={onLogIn}
              className="rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-medium text-white"
            >
              Log in
            </button>
          )}
          <ThemeToggle />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Image Bookmarker</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Save image URLs. Browse them in a visual grid.
          </p>
        </div>
      </div>
    </header>
  );
}
