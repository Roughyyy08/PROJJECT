import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, CheckSquare, Shield, Activity as ActivityIcon, X } from 'lucide-react';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'dash', title: 'Go to Dashboard', icon: LayoutDashboard, onSelect: () => navigate('/dashboard') },
    { id: 'tasks', title: 'Open Task Matrix', icon: CheckSquare, onSelect: () => navigate('/tasks') },
    { id: 'vault', title: 'Access Document Vault', icon: Shield, onSelect: () => navigate('/vault') },
    { id: 'activity', title: 'View Activity Log', icon: ActivityIcon, onSelect: () => navigate('/activity') },
    // Later we can attach actual functions like "Add Task" modal popup, but sticking to router for now
  ];

  const filtered = query ? actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase())) : actions;

  const handleSelect = (action: typeof actions[0]) => {
    action.onSelect();
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/40 backdrop-blur-sm p-4">
       <div className="bg-white w-full max-w-2xl border-2 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center border-b-2 border-black px-4 py-4 gap-3 bg-[#F2F2F7]">
             <Search className="w-5 h-5 text-gray-500" />
             <input 
               ref={inputRef}
               value={query}
               onChange={e => setQuery(e.target.value)}
               placeholder="Search OS commands... (e.g. 'Dashboard')"
               className="flex-1 bg-transparent border-none text-lg outline-none font-medium placeholder:text-gray-400 font-sans"
             />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-300 px-2 py-1 rounded bg-white shadow-sm">ESC</span>
                <button onClick={() => setIsOpen(false)} className="hover:bg-gray-200 p-1 border-2 border-transparent hover:border-black transition-all rounded shadow-sm">
                   <X className="w-4 h-4" />
                </button>
             </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
             {filtered.length > 0 ? (
                filtered.map(action => (
                   <button 
                     key={action.id}
                     onClick={() => handleSelect(action)}
                     className="w-full flex items-center gap-4 p-4 border-2 border-transparent hover:border-black rounded-xl hover:bg-[#E0E7FF] transition-all group font-bold text-left shadow-none hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                   >
                     <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-[#1C1C1E] shrink-0 group-hover:-translate-y-0.5 transition-transform">
                        <action.icon className="w-5 h-5" />
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm uppercase tracking-tight">{action.title}</h4>
                     </div>
                     <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase tracking-widest text-[#1C1C1E] bg-white border-2 border-black px-2 py-1 rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)] transition-all">
                        Execute ↵
                     </span>
                   </button>
                ))
             ) : (
                <div className="p-8 text-center text-gray-500">
                   <p className="font-bold text-sm uppercase tracking-widest">No commands found</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
