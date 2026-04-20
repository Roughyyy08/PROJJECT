import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-[#1C1C1E] mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">404</h1>
      <p className="text-xl text-gray-600 font-bold mb-8 max-w-md">We couldn't locate the requested asset within the architectural ledger.</p>
      <Link 
        to="/dashboard"
        className="bg-[#1C1C1E] text-white px-8 py-4 border-2 border-black rounded-xl font-bold hover:bg-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-[0_0_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] uppercase tracking-widest"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};
