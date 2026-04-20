import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get current user directly from auth
    const currentUser = auth?.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || '');
    } else {
      // No user, redirect to login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleNext = () => {
    if (step < 3) {
      setStep(s => s + 1);
    }
  };

  const handleComplete = async () => {
    if (!user || !db) {
      toast.error('Authentication error');
      return;
    }
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Use Promise.race to enforce a timeout just in case it hangs
      await Promise.race([
        setDoc(userRef, {
          displayName: displayName || user.displayName || 'User',
          onboardingDone: true,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
      ]);
      
      localStorage.setItem('onboarding_override', 'true');
      toast.success('Setup complete!');
      // Let ProtectedRoute handle the navigation once AuthContext synchronizes
    } catch (err: any) {
      console.error('Onboarding error:', err);
      // If it fails or times out, navigate anyway
      localStorage.setItem('onboarding_override', 'true');
      navigate('/dashboard', { replace: true });
    } finally {
      // Delay removing saving state to avoid flickering before router navigation
      setTimeout(() => setSaving(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold">Life Admin OS</h1>
          <span className="text-xs">Step {step} of 3</span>
        </div>

        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[4px_4px_0_black]">
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-4">Let's get to know you</h2>
              <p className="text-gray-600 mb-6">What should we call you?</p>
              <input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full border-2 border-black rounded-lg p-4 mb-6"
              />
              <button onClick={handleNext} className="bg-black text-white px-6 py-3 rounded-lg font-bold">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-4">Add your first task</h2>
              <p className="text-gray-600 mb-6">You can skip this for now.</p>
              <div className="border-2 border-dashed border-gray-400 p-6 rounded-lg mb-6">
                <p className="text-gray-500">Skip for now</p>
              </div>
              <button onClick={handleNext} className="bg-black text-white px-6 py-3 rounded-lg font-bold">
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-4">Deposit a file</h2>
              <p className="text-gray-600 mb-6">You can skip this for now.</p>
              <div className="border-2 border-dashed border-gray-400 p-6 rounded-lg mb-6">
                <p className="text-gray-500">Skip for now</p>
              </div>
              <button 
                onClick={handleComplete} 
                disabled={saving}
                className="bg-black text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};