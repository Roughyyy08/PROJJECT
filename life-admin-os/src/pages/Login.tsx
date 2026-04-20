import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [navigate]);

  const handleGoogleAuth = async () => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      toast.success(`Welcome, ${user.displayName || 'User'}!`);
      
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          onboardingDone: false,
          vaultUsedBytes: 0,
          createdAt: serverTimestamp()
        });
      }
      
      setTimeout(() => navigate('/onboarding', { replace: true }), 1000);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
      } else {
        toast.error(err.message || 'Google Sign-In failed');
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill out all fields');
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth(app);
      const db = getFirestore(app);
      
      let user;
      if (isLogin) {
        user = await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        
        // Create user doc for new users
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            displayName: email.split('@')[0],
            onboardingDone: false,
            vaultUsedBytes: 0,
            createdAt: serverTimestamp()
          });
        }
      }
      
      toast.success(`Welcome, ${user.displayName || 'User'}!`);
      setTimeout(() => navigate('/onboarding', { replace: true }), 1000);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password');
      } else if (err.code === 'auth/email-already-in-use') {
        toast.error('Email already registered');
      } else {
        toast.error(err.message || 'Authentication failed');
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    try {
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="flex flex-col items-center">
           <Loader2 className="w-10 h-10 animate-spin mb-4" />
           <span className="text-xs font-bold uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase">Life Admin OS</h1>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">The Architectural Ledger</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0_black]">
          <h2 className="text-xl font-bold mb-4">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-black rounded-lg p-3 text-sm"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-bold uppercase">Password</label>
                {isLogin && (
                  <button type="button" onClick={handleResetPassword} className="text-xs text-blue-600">Forgot?</button>
                )}
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-black rounded-lg p-3 text-sm"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-black text-white font-bold py-3 rounded-lg"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
            
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-sm text-gray-500"
            >
              {isLogin ? "Need an account?" : "Have an account?"}
            </button>
            
            <hr className="my-4" />
            
            <button 
              type="button"
              onClick={handleGoogleAuth}
              className="w-full border-2 border-gray-300 py-3 rounded-lg text-sm font-bold"
            >
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};