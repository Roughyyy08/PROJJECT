import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, CheckSquare, Shield, Activity as ActivityIcon, Settings, LogOut, Bell, Command } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CommandPalette } from './CommandPalette';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  { label: 'DASHBOARD', path: '/dashboard', icon: LayoutDashboard },
  { label: 'TASKS', path: '/tasks', icon: CheckSquare },
  { label: 'VAULT', path: '/vault', icon: Shield },
  { label: 'ACTIVITY', path: '/activity', icon: ActivityIcon },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  // Custom event to trigger CmdK palette from the visual search bar
  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <div className="flex min-h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans">
      <CommandPalette />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col justify-between shrink-0 hidden md:flex border-r-2 border-black z-10 shadow-[4px_0_0_0_rgba(0,0,0,1)]">
        <div>
          <div className="p-8">
             <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                <span className="font-bold tracking-tight text-xl uppercase">Life Admin</span>
             </div>
             <p className="text-[10px] tracking-widest text-slate-500 uppercase">The Architectural Ledger</p>
          </div>
          
          <nav className="mt-8 px-4 flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2",
                    active 
                      ? "bg-[#1C1C1E] text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      : "border-transparent text-gray-500 hover:text-[#1C1C1E] hover:bg-[#FEE2E2] hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 space-y-1">
           <Link to="/settings" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold border-2 border-transparent text-gray-500 hover:text-[#1C1C1E] hover:bg-[#FEE2E2] hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-xl transition-all block">
              <Settings className="w-4 h-4 shrink-0" />
              SETTINGS
           </Link>
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold border-2 border-transparent text-gray-500 hover:text-[#1C1C1E] hover:bg-[#FEE2E2] hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-xl transition-all"
           >
              <LogOut className="w-4 h-4 shrink-0" />
              LOGOUT
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
         <header className="h-20 border-b-2 border-black bg-white flex items-center justify-between px-8 shrink-0 z-10 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
             <div className="flex-1 max-w-2xl">
                 <div className="relative group flex items-center cursor-pointer" onClick={openCommandPalette}>
                    <input 
                      type="text"
                      readOnly
                      placeholder="Access Command Palette..."
                      className="w-full bg-[#F2F2F7] border-2 border-black text-sm py-3 pl-12 pr-20 rounded-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus:outline-none cursor-pointer placeholder-gray-500 font-bold uppercase tracking-widest text-[10px]"
                    />
                    <div className="absolute left-4 text-black pointer-events-none">
                      <Command className="w-4 h-4" />
                    </div>
                    <div className="absolute right-4 pointer-events-none font-bold text-[10px] bg-white border border-black px-2 py-1 rounded shadow-sm">
                       ⌘ K
                    </div>
                 </div>
             </div>

             <div className="flex items-center gap-6 ml-8">
                 <button className="text-[#1C1C1E] border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all rounded-full p-2 relative bg-[#D1FAE5]">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 border border-black rounded-full"></span>
                 </button>
                 <div className="h-10 w-10 border-2 border-black box-border rounded-full bg-[#E0E7FF] text-[#1C1C1E] flex items-center justify-center text-sm font-bold cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                 </div>
             </div>
         </header>

         <div className="flex-1 overflow-auto bg-[#F2F2F7] p-8">
            <div className="max-w-5xl mx-auto">
               {children}
            </div>
         </div>
      </main>

    </div>
  );
}
