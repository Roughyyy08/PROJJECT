import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { activityService, ActivityLog } from '../services/activityService';
import { formatDistanceToNow } from 'date-fns';
import { Activity as ActivityIcon, CheckCircle2, FileText, Trash2, Shield, UploadCloud } from 'lucide-react';

export const Activity = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Simple fetch for the most recent 50 logs
    activityService.getRecentLogs(user.uid, 50).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, [user]);

  const getLogIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'task_created': return <ActivityIcon className="w-4 h-4 text-blue-600" />;
      case 'task_updated': return <ActivityIcon className="w-4 h-4 text-amber-600" />;
      case 'task_completed': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'task_deleted': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'document_uploaded': return <UploadCloud className="w-4 h-4 text-emerald-600" />;
      case 'document_deleted': return <Trash2 className="w-4 h-4 text-red-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLogColor = (action: ActivityLog['action']) => {
    switch (action) {
      case 'task_created': return 'bg-blue-100';
      case 'task_updated': return 'bg-amber-100';
      case 'task_completed': return 'bg-[#D1FAE5]';
      case 'task_deleted': return 'bg-[#FEE2E2]';
      case 'document_uploaded': return 'bg-[#D1FAE5]';
      case 'document_deleted': return 'bg-[#FEE2E2]';
      default: return 'bg-gray-100';
    }
  };

  return (
    <Layout>
      <div className="mb-8 p-6 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <h1 className="text-2xl font-bold tracking-tight uppercase">Activity Log</h1>
        <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Read-only transaction history.</p>
      </div>
      
      <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
         {loading ? (
            <div className="relative border-l-2 border-gray-200 ml-4 sm:ml-8 space-y-8 py-4">
               {[1, 2, 3, 4].map(i => (
                  <div key={i} className="relative pl-6 sm:pl-8 animate-pulse">
                     <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 border-gray-200 bg-white"></div>
                     <div className="bg-white border-2 border-gray-200 rounded-xl p-4 inline-block min-w-full sm:min-w-[300px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                           <div className="w-24 h-5 bg-gray-200 rounded"></div>
                           <div className="w-16 h-3 bg-gray-200 rounded mt-1 sm:mt-0"></div>
                        </div>
                        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                     </div>
                  </div>
               ))}
            </div>
         ) : logs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#1C1C1E]">
               <span className="text-4xl mb-4">📡</span>
               <h3 className="font-bold uppercase tracking-widest text-lg">No Signal</h3>
               <p className="text-sm font-bold text-gray-500 mt-2 text-center">No transactions have been recorded in the ledger yet.</p>
            </div>
         ) : (
            <div className="relative border-l-2 border-black ml-4 sm:ml-8 space-y-8 py-4">
               {logs.map((log) => (
                  <div key={log.id} className="relative pl-6 sm:pl-8">
                     <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${getLogColor(log.action)}`}>
                        {getLogIcon(log.action)}
                     </div>
                     <div className="bg-[#F2F2F7] border-2 border-black rounded-xl p-4 shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block min-w-full sm:min-w-[300px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                           <span className="text-[10px] font-bold uppercase tracking-widest bg-white border border-black px-2 py-0.5 rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)] self-start">
                              {log.action.replace('_', ' ')}
                           </span>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono">
                              {log.createdAt ? formatDistanceToNow(log.createdAt.toMillis(), { addSuffix: true }) : 'Just now'}
                           </span>
                        </div>
                        <p className="font-bold text-sm text-[#1C1C1E]">
                           {log.entityType === 'document' ? 'Asset' : 'Task'}: <span className="text-indigo-700">{log.entityName}</span>
                        </p>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </Layout>
  );
};
