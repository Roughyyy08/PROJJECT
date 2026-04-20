import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  onboardingDone: boolean | null;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  onboardingDone: null
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubUserDoc: (() => void) | null = null;
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        // Fallback: If Firebase backend is unresponsive (e.g. database still propagating), clear loading after 5s
        loadingTimeout = setTimeout(() => {
          setLoading(false);
        }, 5000);

        unsubUserDoc = onSnapshot(doc(db, 'users', currentUser.uid), 
          (docSnap) => {
            if (loadingTimeout) clearTimeout(loadingTimeout);
            
            if (docSnap.exists()) {
              setOnboardingDone(docSnap.data().onboardingDone === true);
            } else {
              setOnboardingDone(false);
            }
            setLoading(false);
          }, 
          (error) => {
            console.error("Firestore onSnapshot error:", error);
            if (loadingTimeout) clearTimeout(loadingTimeout);
            setOnboardingDone(false);
            setLoading(false);
          }
        );
      } else {
        if (unsubUserDoc) unsubUserDoc();
        setOnboardingDone(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, onboardingDone }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};