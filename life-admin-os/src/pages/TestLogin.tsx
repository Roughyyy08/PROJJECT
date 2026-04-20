import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase';

export const TestLogin = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    // Check for redirect result
    getRedirectResult(auth).then(async (result) => {
      if (result) {
        const user = result.user;
        setStatus('Signed in! Redirect from Google: ' + user.email);
        
        // Create user doc
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
            onboardingDone: false,
            createdAt: serverTimestamp()
          });
        }
        
        // Redirect to onboarding
        setTimeout(() => navigate('/onboarding', { replace: true }), 2000);
      } else {
        setStatus('Ready to sign in');
      }
    }).catch((err) => {
      if (err.code !== 'auth/no-auth-event') {
        setError('Error: ' + err.code);
      } else {
        setStatus('Ready to sign in');
      }
    });
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      setError('Error: ' + err.code);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Firebase Test Page</h1>
      <p style={{ color: error ? 'red' : 'green' }}>{error || status}</p>
      <button 
        onClick={handleGoogleSignIn}
        style={{ 
          background: '#4285F4', 
          color: 'white', 
          padding: '15px 30px', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Sign in with Google (Redirect)
      </button>
      <p style={{ marginTop: '20px' }}>
        <a href="/login">Back to Login</a>
      </p>
    </div>
  );
};