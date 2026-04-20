import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../context/TaskContext';
import { useDocuments } from '../context/DocumentContext';
import { taskService, TaskPriority, TaskCategory, TaskStatus, TaskRecurrence } from '../services/taskService';
import { planningService } from '../services/planningService';
import { Timestamp } from 'firebase/firestore';
import { format, isBefore, startOfDay, isSameDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Plus, Check, Trash2, Calendar, AlertCircle, Link, Repeat } from 'lucide-react';

export const Tasks = () => {
  const { user } = useAuth();
  const { tasks, loading } = useTasks();
  const { documents } = useDocuments();

  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskStatus>('active');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'All'>('All');
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Personal');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [linkedDocId, setLinkedDocId] = useState<string>('');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [estimatedDurationDays, setEstimatedDurationDays] = useState<number | undefined>(1);
  const [intensity, setIntensity] = useState<'Light' | 'Moderate' | 'Heavy'>('Moderate');
  const [saving, setSaving] = useState(false);

  const today = startOfDay(new Date());

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    
    setSaving(true);
    try {
      const parsedTags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
      await taskService.createTask(user.uid, {
        title,
        category,
        priority,
        deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
        notes,
        documentIds: linkedDocId ? [linkedDocId] : [],
        tags: parsedTags,
        recurrence,
        estimatedDurationDays,
        intensity
      });
      toast.success('Dispatched to Ledger');
      setIsAdding(false);
      setTitle('');
      setNotes('');
      setDeadline('');
      setTagsInput('');
      setLinkedDocId('');
      setRecurrence('none');
      setEstimatedDurationDays(1);
      setIntensity('Moderate');
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string, title: string) => {
    if (!user) {
      toast.error('Please log in to complete tasks');
      return;
    }
    try {
      await taskService.completeTask(user.uid, id, title);
      toast.success('Marked as Resolved');
    } catch (err) {
      toast.error('Transaction failed');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!user) {
      toast.error('Please log in to delete tasks');
      return;
    }
    try {
      await taskService.deleteTask(user.uid, id, title);
      toast.success('Record purged');
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => t.status === activeTab);
    if (filterCategory !== 'All') {
      result = result.filter(t => t.category === filterCategory);
    }
    return result.sort((a, b) => {
      // Sort by deadline (ascending), putting nulls at the end
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.toMillis() - b.deadline.toMillis();
    });
  }, [tasks, activeTab, filterCategory]);

  return (
    <Layout>
      <div className="mb-6 p-6 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
           <h1 className="text-3xl font-bold tracking-tight uppercase">Task Ledger</h1>
           <p className="text-sm font-bold text-gray-500 mt-2 max-w-2xl">
             Systematic organization for personal, academic, and professional obligations. 
             Every entry is a commitment to clarity.
           </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#1C1C1E] text-white px-6 py-3 border-2 border-black rounded-xl font-bold hover:bg-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-[0_0_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] flex items-center gap-2 uppercase tracking-widest text-[#10px]"
        >
          {isAdding ? 'Cancel Entry' : <><Plus className="w-4 h-4" /> New Entry</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateTask} className="mb-8 p-6 bg-[#D1FAE5] border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-top-4">
           <h2 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
             <div className="w-3 h-3 bg-black rounded-full"></div>
             Initialize Record
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-3">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Title</label>
                 <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-medium font-sans"
                    placeholder="Enter task objective..."
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Category</label>
                 <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)} className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold font-sans">
                    <option value="Personal">Personal</option>
                    <option value="Academic">Academic</option>
                    <option value="Financial">Financial</option>
                    <option value="Health">Health</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Priority</label>
                 <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold font-sans">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Deadline</label>
                 <input 
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-mono font-bold"
                 />
              </div>

              {/* Smart Start Engine Fields */}
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Estimated Effort</label>
                 <select 
                    value={estimatedDurationDays} 
                    onChange={e => setEstimatedDurationDays(e.target.value ? parseInt(e.target.value) : undefined)} 
                    className="w-full bg-[#E0E7FF] text-indigo-900 border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold font-sans"
                 >
                    <option value="1">1 Day (Quick Task)</option>
                    <option value="2">2-3 Days (Standard)</option>
                    <option value="5">1 Week (Project)</option>
                    <option value="14">2 Weeks (Deep Work)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Work Intensity</label>
                 <select 
                    value={intensity} 
                    onChange={e => setIntensity(e.target.value as 'Light' | 'Moderate' | 'Heavy')} 
                    className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold font-sans"
                 >
                    <option value="Light">Light Focus</option>
                    <option value="Moderate">Moderate Focus</option>
                    <option value="Heavy">Heavy Focus</option>
                 </select>
              </div>

              <div className="lg:col-span-2">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Link Document (Core System)</label>
                 <select 
                    value={linkedDocId} 
                    onChange={e => setLinkedDocId(e.target.value)} 
                    className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold font-sans"
                 >
                    <option value="">-- No linked asset --</option>
                    {documents.map(doc => (
                       <option key={doc.id} value={doc.id}>{doc.name}</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Recurrence Pattern</label>
                 <select value={recurrence} onChange={e => setRecurrence(e.target.value as TaskRecurrence)} className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold font-sans">
                    <option value="none">One-time Execution</option>
                    <option value="daily">Daily Loop</option>
                    <option value="weekly">Weekly Loop</option>
                    <option value="monthly">Monthly Loop</option>
                 </select>
              </div>
              <div className="lg:col-span-3">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Tags (Comma Separated)</label>
                 <input 
                    type="text" 
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-medium font-sans"
                    placeholder="e.g., #visa, #semester, remote"
                 />
              </div>
              <div className="lg:col-span-3">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1C1E] mb-2">Notes (Optional)</label>
                 <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-white border-2 border-black rounded-md px-4 py-3 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-medium font-sans resize-none"
                    placeholder="Execution details..."
                 />
              </div>
           </div>
           <div className="flex justify-end mt-4">
              <button disabled={saving} type="submit" className="bg-[#1C1C1E] text-white px-8 py-3 border-2 border-black rounded-xl font-bold hover:bg-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-[0_0_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] uppercase tracking-widest disabled:opacity-50">
                 Commit Record
              </button>
           </div>
           
           {/* Smart Start Engine Instant Feedback */}
           {deadline && estimatedDurationDays && (
              <div className="mt-6 p-4 rounded-xl border-2 border-dashed bg-gray-50 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Execution Intelligence</p>
                    <p className="text-sm font-bold text-[#1C1C1E]">
                       {(() => {
                         const dlDate = new Date(deadline);
                         const plan = planningService.calculatePlanningFields(dlDate, estimatedDurationDays);
                         
                         const isConflict = planningService.detectConflicts(plan.suggestedStartDate, dlDate, tasks.filter(t => t.status === 'active' && t.id !== undefined));

                         if (isConflict) {
                            return <span className="text-amber-600">⚡ High Conflict Warning: You already have 3+ tasks running during this window. Re-plan recommended.</span>;
                         }

                         if (plan.riskLevel === 'high' || plan.riskLevel === 'critical') {
                            return <span className="text-red-600">⚠️ You are already behind schedule. Act immediately.</span>;
                         }
                         if (!plan.suggestedStartDate) return '';
                         return <span>🧠 You should start by <span className="underline">{format(plan.suggestedStartDate, 'MMM do, yyyy')}</span> to finish on time.</span>;
                       })()}
                    </p>
                 </div>
              </div>
           )}
        </form>
      )}

      {/* Constraints & Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
         <div className="flex gap-2">
            {(['active', 'completed'] as TaskStatus[]).map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-4 py-2 border-2 border-black rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#1C1C1E] text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-white text-gray-500 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-[1px]'}`}
               >
                 {tab === 'active' ? 'Active Matrix' : 'Resolved'}
               </button>
            ))}
         </div>
         <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value as TaskCategory | 'All')}
            className="w-full sm:w-48 bg-white border-2 border-black rounded-xl px-4 py-2 text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-ring font-bold uppercase tracking-widest"
         >
            <option value="All">ALL SCOPES</option>
            <option value="Personal">PERSONAL</option>
            <option value="Academic">ACADEMIC</option>
            <option value="Financial">FINANCIAL</option>
            <option value="Health">HEALTH</option>
         </select>
      </div>

      {/* Task List */}
      <div className="space-y-4">
         {loading ? (
             [1, 2, 3, 4].map(i => (
               <div key={i} className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center border-2 border-black rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white animate-pulse">
                  <div className="flex-1 min-w-0 py-1">
                     <div className="w-1/2 h-6 bg-gray-200 rounded mb-2"></div>
                     <div className="flex gap-2 mt-3">
                        <div className="w-16 h-5 bg-gray-200 rounded"></div>
                        <div className="w-16 h-5 bg-gray-200 rounded"></div>
                        <div className="w-24 h-5 bg-gray-200 rounded"></div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     <div className="w-11 h-11 bg-gray-200 rounded-xl border-2 border-transparent"></div>
                     <div className="w-11 h-11 bg-gray-200 rounded-xl border-2 border-transparent"></div>
                  </div>
               </div>
             ))
         ) : filteredTasks.length === 0 ? (
            <div className="py-16 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center justify-center text-[#1C1C1E]">
               <span className="text-4xl mb-4 opacity-50">🗄️</span>
               <h3 className="font-bold uppercase tracking-widest">No Records Found</h3>
               <p className="text-sm font-bold text-gray-500 mt-1">The filtered ledger is currently empty.</p>
            </div>
         ) : (
            filteredTasks.map(task => {
               const deadlineDate = task.deadline ? new Date(task.deadline.toMillis()) : null;
               const isOverdue = task.status === 'active' && deadlineDate && isBefore(deadlineDate, today);
               const isDueToday = task.status === 'active' && deadlineDate && isSameDay(deadlineDate, today);
               const isDone = task.status === 'completed';
               const linkedDoc = task.documentIds?.[0] ? documents.find(d => d.id === task.documentIds![0]) : null;

               return (
                 <div key={task.id} className={`p-5 flex flex-col sm:flex-row gap-4 sm:items-center border-2 border-black rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all ${isDone ? 'bg-[#F2F2F7] opacity-80' : isOverdue ? 'bg-[#FEE2E2]' : isDueToday ? 'bg-[#FEF3C7]' : 'bg-white'}`}>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-3 mb-1">
                          <h4 className={`text-lg font-bold truncate ${isDone ? 'line-through text-gray-500' : 'text-[#1C1C1E]'}`}>{task.title}</h4>
                          {isOverdue && (
                             <span className="shrink-0 bg-red-500 text-white border-2 border-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)] animate-pulse flex items-center gap-1">
                               <AlertCircle className="w-3 h-3" /> Overdue
                             </span>
                          )}
                          {!isOverdue && isDueToday && (
                             <span className="shrink-0 bg-amber-400 text-black border-2 border-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded shadow-[1px_1px_0_0_rgba(0,0,0,1)] flex items-center gap-1">
                               ⏳ Due Today
                             </span>
                          )}
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-500 mt-3">
                          <span className={`px-2 py-1 rounded border-2 border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-[10px] bg-white ${task.priority === 'High' ? 'text-red-600' : task.priority === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`}>
                             {task.priority} Prio
                          </span>
                          <span className="px-2 py-1 rounded border border-gray-300 bg-white">
                             {task.category}
                          </span>
                          {task.deadline && (
                             <span className="flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white font-mono">
                                <Calendar className="w-3 h-3" />
                                {format(task.deadline.toMillis(), 'MMM d, yyyy')}
                             </span>
                          )}
                          {task.suggestedStartDate && !isDone && (
                             <span className="flex items-center gap-1 px-2 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-800">
                                Start: {format(task.suggestedStartDate.toMillis(), 'MMM d')}
                             </span>
                          )}
                          {task.riskLevel && !isDone && (
                             <span className={`px-2 py-1 rounded border-2 border-black font-bold shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${
                                task.riskLevel === 'critical' ? 'bg-red-800 text-white' :
                                task.riskLevel === 'high' ? 'bg-red-500 text-white' :
                                task.riskLevel === 'medium' ? 'bg-amber-400 text-black' :
                                'bg-green-500 text-black'
                             }`}>
                                {task.riskLevel === 'critical' ? 'CRITICAL RISK' :
                                 task.riskLevel === 'high' ? 'BEHIND' :
                                 task.riskLevel === 'medium' ? 'AT RISK' :
                                 'ON TRACK'}
                             </span>
                          )}
                          {task.recurrence && task.recurrence !== 'none' && (
                             <span className="flex items-center gap-1 px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700">
                                <Repeat className="w-3 h-3" /> {task.recurrence}
                             </span>
                          )}
                          {linkedDoc && (
                             <span title={`Linked Asset: ${linkedDoc.name}`} className="flex items-center gap-1 px-2 py-1 rounded border border-[#1C1C1E] bg-[#E0E7FF] text-[#1C1C1E] text-[10px]">
                                <Link className="w-3 h-3" /> Asset Linked
                             </span>
                          )}
                          {task.tags && task.tags.map(tag => (
                             <span key={tag} className="px-2 py-1 rounded border-2 border-black bg-[#F2F2F7] shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-[9px] uppercase tracking-widest text-[#1C1C1E]">
                                #{tag.replace(/^#/, '')}
                             </span>
                          ))}
                       </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t-2 border-gray-200 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                       {!isDone && (
                          <button 
                            onClick={() => handleComplete(task.id, task.title)}
                            className="bg-[#D1FAE5] text-emerald-900 px-3 py-3 border-2 border-black rounded-xl font-bold hover:bg-emerald-300 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            title="Mark Resolved"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                       )}
                       <button 
                         onClick={() => handleDelete(task.id, task.title)}
                         className="bg-white text-red-600 px-3 py-3 border-2 border-black rounded-xl font-bold hover:bg-[#FEE2E2] transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                         title="Purge Record"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>

                 </div>
               );
            })
         )}
      </div>

    </Layout>
  );
};
