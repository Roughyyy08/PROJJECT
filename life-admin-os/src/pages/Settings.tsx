import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

export const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to update profile');
      return;
    }
    
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { displayName });
      await refreshUser();
      toast.success('Profile identity updated');
    } catch (err) {
      toast.error('Failed to update identity');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8 p-6 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <h1 className="text-2xl font-bold tracking-tight uppercase">System Settings</h1>
        <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Configuration and Identity Management.</p>
      </div>

      <div className="max-w-2xl bg-white border-2 border-black rounded-3xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <h2 className="text-lg font-bold uppercase tracking-widest text-[#1C1C1E] mb-6 border-b-2 border-black pb-2">Profile Identity</h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Display Name</label>
            <input 
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all font-bold font-sans"
              placeholder="System Username"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address (Immutable)</label>
            <input 
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-gray-100 border-2 border-gray-300 text-gray-500 rounded-md px-4 py-3 text-sm font-bold font-sans opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="pt-4">
             <button disabled={saving} type="submit" className="bg-[#1C1C1E] text-white px-8 py-3 border-2 border-black rounded-xl font-bold hover:bg-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-[0_0_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] uppercase tracking-widest disabled:opacity-50">
               {saving ? 'Committing...' : 'Commit Changes'}
             </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
