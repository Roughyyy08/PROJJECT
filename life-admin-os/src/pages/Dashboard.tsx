import React from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../context/TaskContext';
import { useDocuments } from '../context/DocumentContext';
import { isBefore, addDays, startOfDay } from 'date-fns';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, FileWarning, Calendar } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const { documents, loading: docsLoading } = useDocuments();

  const loading = tasksLoading || docsLoading;

  const today = startOfDay(new Date());
  const fourteenDaysFromNow = addDays(today, 14);

  // Smart Start Engine - Today's Plan
  const todaysPlanTasks = tasks.filter(t => 
    t.status === 'active' && 
    (t.suggestedStartDate && !isBefore(today, new Date(t.suggestedStartDate.toMillis())))
  ).sort((a, b) => {
     const scoreA = a.riskLevel === 'critical' ? 4 : a.riskLevel === 'high' ? 3 : a.riskLevel === 'medium' ? 2 : 1;
     const scoreB = b.riskLevel === 'critical' ? 4 : b.riskLevel === 'high' ? 3 : b.riskLevel === 'medium' ? 2 : 1;
     return scoreB - scoreA;
  });

  // Stats calculation
  const tasksDueSoon = tasks.filter(t => t.status === 'active' && t.deadline && isBefore(new Date(t.deadline.toMillis()), fourteenDaysFromNow) && !isBefore(new Date(t.deadline.toMillis()), today));
  const tasksOverdue = tasks.filter(t => t.status === 'active' && t.deadline && isBefore(new Date(t.deadline.toMillis()), today));
  
  const docsExpiringSoon = documents.filter(d => d.expiryDate && isBefore(new Date(d.expiryDate.toMillis()), addDays(today, 30)));
  const docsExpired = documents.filter(d => d.expiryDate && isBefore(new Date(d.expiryDate.toMillis()), today));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const hasUrgentIssues = tasksOverdue.length > 0 || docsExpired.length > 0;

  // Timeline preparation (Urgency Based Sorting)
  interface TimelineItem {
    id: string;
    title: string;
    date: Date | null;
    type: 'task' | 'document';
    urgencyScore: number;
    isActNow: boolean;
  }

  const getUrgencyScore = (date: Date | null, priority?: string, isOverdueCheck?: boolean) => {
    let score = 0;
    if (priority === 'High') score += 20;
    if (priority === 'Medium') score += 10;
    
    if (date) {
      if (isOverdueCheck) {
         score += 50; // Overdue
      } else {
         const daysUntil = Math.max(0, Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
         if (daysUntil === 0) score += 40; // Due Today
         else if (daysUntil <= 3) score += 30; // Due very soon
         else if (daysUntil <= 7) score += 15;
         else if (daysUntil <= 14) score += 5;
      }
    }
    return score;
  };

  const timelineItems: TimelineItem[] = [
    ...tasks.filter(t => t.status === 'active').map(t => {
       const date = t.deadline ? new Date(t.deadline.toMillis()) : null;
       const isOverdue = date ? isBefore(date, today) : false;
       const urgencyScore = getUrgencyScore(date, t.priority, isOverdue);
       return {
          id: t.id,
          title: t.title,
          date,
          type: 'task' as const,
          urgencyScore,
          isActNow: urgencyScore >= 40 || isOverdue
       };
    }),
    ...documents.filter(d => d.expiryDate).map(d => {
       const date = new Date(d.expiryDate!.toMillis());
       const isExpired = isBefore(date, today);
       // Documents are inherently important, treat as High priority for urgency math
       const urgencyScore = getUrgencyScore(date, 'High', isExpired); 
       return {
          id: d.id,
          title: `${d.name} Expires`,
          date,
          type: 'document' as const,
          urgencyScore,
          isActNow: urgencyScore >= 40 || isExpired
       };
    })
  ].filter(item => item.urgencyScore > 0).sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 10); // Take top 10 most urgent


  const StatSkeleton = () => (
    <div className="bg-[#F2F2F7] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-pulse">
       <div className="w-6 h-6 bg-gray-300 rounded-full mb-4"></div>
       <div className="w-12 h-8 bg-gray-300 rounded mb-4"></div>
       <div className="w-24 h-4 bg-gray-300 rounded"></div>
    </div>
  );

  return (
    <Layout>
      {/* Red Overdue Banner */}
      {!loading && hasUrgentIssues && (
        <div className="mb-6 p-4 bg-[#FEE2E2] border-2 border-black rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-between animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                 <h3 className="font-bold uppercase tracking-tight text-red-900">Immediate Action Required</h3>
                 <p className="text-sm font-bold text-red-700">
                    You have {tasksOverdue.length > 0 ? `${tasksOverdue.length} overdue task(s)` : ''} 
                    {tasksOverdue.length > 0 && docsExpired.length > 0 ? ' and ' : ''}
                    {docsExpired.length > 0 ? `${docsExpired.length} expired document(s)` : ''}.
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* TODAY'S PLAN HOOK */}
      {!loading && todaysPlanTasks.length > 0 && (
         <div className="mb-8 p-6 bg-[#1C1C1E] text-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col gap-4 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
               🔥 What to work on TODAY
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
               {todaysPlanTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="bg-white text-black border-2 border-black rounded-xl p-4 shadow-[2px_2px_0_0_rgba(255,255,255,0.2)]">
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm truncate pr-2">{task.title}</h4>
                        {task.riskLevel && (
                           <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold border-2 border-black ${
                              task.riskLevel === 'critical' ? 'bg-red-800 text-white' :
                              task.riskLevel === 'high' ? 'bg-red-500 text-white' :
                              task.riskLevel === 'medium' ? 'bg-amber-400 text-black' :
                              'bg-green-500 text-black'
                           }`}>
                              {task.riskLevel === 'critical' ? 'CRITICAL' : task.riskLevel === 'high' ? 'BEHIND' : task.riskLevel === 'medium' ? 'AT RISK' : 'ON TRACK'}
                           </span>
                        )}
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <span className="bg-gray-100 px-2 py-1 rounded">Estimated: {task.estimatedDurationDays || 1}d</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Header */}
      <div className="mb-8 p-6 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Dashboard Overview</h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">Welcome back, {user?.displayName}. System optimal.</p>
        </div>
        <div className="text-right">
           {loading ? (
              <div className="w-16 h-10 bg-gray-200 animate-pulse rounded border border-gray-300"></div>
           ) : (
              <span className="text-4xl font-bold italic tracking-tighter">{completionRate}%</span>
           )}
           <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mt-1">Completion Rate</p>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {loading ? (
            <>
               <StatSkeleton />
               <StatSkeleton />
               <StatSkeleton />
               <StatSkeleton />
            </>
         ) : (
            <>
               <div className="bg-[#D1FAE5] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                     <Clock className="w-6 h-6 text-emerald-700" />
                     <span className="text-3xl font-bold tracking-tighter">{tasksDueSoon.length}</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight">Tasks Due (14d)</h3>
               </div>

               <div className="bg-[#FEE2E2] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                     <AlertTriangle className="w-6 h-6 text-red-600" />
                     <span className="text-3xl font-bold tracking-tighter text-red-600">{tasksOverdue.length}</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-red-900">Overdue Tasks</h3>
               </div>

               <div className="bg-[#FEF3C7] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                     <FileWarning className="w-6 h-6 text-amber-600" />
                     <span className="text-3xl font-bold tracking-tighter">{docsExpiringSoon.length}</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-amber-900">Expiring Docs (30d)</h3>
               </div>

               <div className="bg-[#E0E7FF] border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                     <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                     <span className="text-3xl font-bold tracking-tighter">{completedTasks}</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-indigo-900">Resolved Tasks</h3>
               </div>
            </>
         )}
      </div>

      {/* Weekly Insights & Attention Matrix Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Column: Attention Matrix */}
         <div className="lg:col-span-2">
            <h2 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black"></div>
               Attention Matrix (Top 10)
            </h2>
            <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
               {loading ? (
                   <div className="space-y-4">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl animate-pulse">
                          <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0"></div>
                          <div className="flex-1 space-y-2">
                             <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                             <div className="w-1/4 h-3 bg-gray-200 rounded"></div>
                          </div>
                          <div className="w-16 h-6 bg-gray-200 rounded shrink-0"></div>
                       </div>
                     ))}
                   </div>
               ) : timelineItems.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                     <span className="text-4xl mb-4">🧘</span>
                     <h3 className="font-bold text-[#1C1C1E] uppercase tracking-wide">Zero Urgency</h3>
                     <p className="text-sm text-gray-500 font-bold mt-1">No items require immediate attention. Focus on steady progression.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {timelineItems.map(item => (
                        <div key={`${item.type}-${item.id}`} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-2 border-black rounded-xl transition-all ${item.isActNow ? 'bg-[#FEE2E2] hover:bg-red-200' : 'hover:bg-[#F2F2F7]'}`}>
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0 ${item.type === 'task' ? 'bg-[#E0E7FF] text-indigo-900' : 'bg-[#FEF3C7] text-amber-900'}`}>
                              {item.type === 'task' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                 <h4 className="font-bold truncate text-sm">{item.title}</h4>
                                 {item.isActNow && (
                                    <span className="shrink-0 bg-red-600 text-white border-2 border-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)] animate-bounce flex items-center gap-1">
                                      🔥 ACT NOW
                                    </span>
                                 )}
                              </div>
                              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1 flex gap-3">
                                 {item.date && (
                                    <span className="flex items-center gap-1">
                                       <Calendar className="w-3 h-3" />
                                       {item.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                 )}
                                 <span className="text-amber-600">Score: {item.urgencyScore}</span>
                              </p>
                           </div>
                           <div className="shrink-0 bg-white border-2 border-black px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-md shadow-[2px_2px_0_0_rgba(0,0,0,1)] self-start sm:self-auto">
                              {item.type}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Right Column: Weekly Insights */}
         <div className="lg:col-span-1">
            <h2 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
               <div className="w-3 h-3 bg-indigo-500 rounded-full border border-black"></div>
               Weekly Insights
            </h2>
            <div className="bg-[#1C1C1E] text-white border-2 border-black rounded-3xl p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col gap-6">
               {loading ? (
                  <div className="animate-pulse space-y-4">
                     <div className="h-20 bg-gray-700 border-2 border-gray-600 rounded-xl"></div>
                     <div className="h-20 bg-gray-700 border-2 border-gray-600 rounded-xl"></div>
                  </div>
               ) : (
                  <>
                     <div className="bg-white text-[#1C1C1E] border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0_0_rgba(255,255,255,0.2)]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Execution Velocity</p>
                        <div className="flex items-end gap-2">
                           <span className="text-3xl font-bold tracking-tighter">
                              {tasks.filter(t => t.status === 'completed' && t.completedAt && !isBefore(new Date(t.completedAt.toMillis()), addDays(today, -7))).length}
                           </span>
                           <span className="text-sm font-bold text-gray-500 mb-1">tasks this week</span>
                        </div>
                     </div>
                     
                     <div className="bg-[#FEE2E2] text-red-900 border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0_0_rgba(255,255,255,0.2)]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">Missed Commitments</p>
                        <div className="flex items-end gap-2">
                           <span className="text-3xl font-bold tracking-tighter">{tasksOverdue.length}</span>
                           <span className="text-sm font-bold opacity-70 mb-1">overdue items</span>
                        </div>
                     </div>

                     <div className="bg-[#FEF3C7] text-amber-900 border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0_0_rgba(255,255,255,0.2)]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Upcoming Risks</p>
                        <div className="flex items-end gap-2">
                           <span className="text-3xl font-bold tracking-tighter">{tasksDueSoon.length + docsExpiringSoon.length}</span>
                           <span className="text-sm font-bold opacity-70 mb-1">due in 14 days</span>
                        </div>
                     </div>
                  </>
               )}
            </div>
         </div>
      </div>

    </Layout>
  );
};
