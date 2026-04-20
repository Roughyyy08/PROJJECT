import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { firebaseInitialized } from '../firebase';

export const ProtectedRoute = ({ 
  children, 
  requireOnboarding = true 
}: { 
  children: React.ReactNode; 
  requireOnboarding?: boolean 
}) => {
  const { user, loading, onboardingDone } = useAuth();
  const location = useLocation();

  // If Firebase not configured at all, show error
  if (!firebaseInitialized) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center flex-col p-8">
        <div className="text-red-600 text-xl font-bold mb-4">Firebase Error</div>
        <p className="text-gray-600">Please check your .env configuration</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1C1C1E] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow escape hatch if backend synchronization is timing out
  const localOverride = localStorage.getItem('onboarding_override') === 'true';

  // If user is accessing dashboard but hasn't completed onboarding
  if (requireOnboarding && onboardingDone === false && !localOverride) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is accessing onboarding but already finished it
  if (!requireOnboarding && (onboardingDone === true || localOverride)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};