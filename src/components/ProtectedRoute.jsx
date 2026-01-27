import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  /**
   * Accessing 'user' and 'isLoading' from the auth state.
   * Matches your authSlice.js state structure exactly.
   */
  const { user, isLoading } = useSelector((state) => state.auth);

  /**
   * STEP 1: Initial Loading Guard
   * Prevents premature redirecting to the Home page while the 
   * application is still retrieving the user session from localStorage.
   */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="animate-spin text-teal-500 mb-2" size={32} />
        <p className="text-slate-400 font-medium italic">Verifying access...</p>
      </div>
    );
  }

  /**
   * STEP 2: Authentication Check
   * If loading is finished and no user is found, redirect to the Home page.
   */
  if (!user) {
    return <Navigate to="/" replace />;
  }

  /**
   * STEP 3: Render Nested Routes
   * Renders the child components (PracticePage, Lessons, etc.) defined in App.jsx.
   */
  return <Outlet />;
};

// Crucial: This default export prevents the 'SyntaxError' in App.jsx
export default ProtectedRoute;