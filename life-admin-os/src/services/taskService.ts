import { collection, doc, setDoc, updateDoc, deleteDoc, query, onSnapshot, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { activityService } from './activityService';
import { planningService } from './planningService';

export type TaskCategory = 'Academic' | 'Financial' | 'Personal' | 'Health';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'active' | 'completed';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type TaskRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  deadline: Timestamp | null;
  status: TaskStatus;
  notes?: string;
  documentIds?: string[];
  tags?: string[];
  recurrence?: TaskRecurrence;
  estimatedDurationDays?: number;
  bufferDays?: number;
  suggestedStartDate?: Timestamp | null;
  riskLevel?: TaskRiskLevel;
  intensity?: 'Light' | 'Moderate' | 'Heavy';
  completedAt?: Timestamp | null;
  createdAt: Timestamp;
}

export const taskService = {
  subscribeToTasks: (userId: string, callback: (tasks: Task[]) => void) => {
    const q = query(collection(db, 'users', userId, 'tasks'));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      callback(tasks);
    });
  },

  createTask: async (userId: string, data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'status' | 'completedAt' | 'suggestedStartDate' | 'bufferDays' | 'riskLevel'>) => {
    const newDocRef = doc(collection(db, 'users', userId, 'tasks'));
    
    const dlDate = data.deadline ? new Date(data.deadline.toMillis()) : null;
    const plan = planningService.calculatePlanningFields(dlDate, data.estimatedDurationDays || null);

    const taskData = {
      ...data,
      id: newDocRef.id,
      userId,
      status: 'active' as TaskStatus,
      suggestedStartDate: plan.suggestedStartDate ? Timestamp.fromDate(plan.suggestedStartDate) : null,
      bufferDays: plan.bufferDays,
      riskLevel: plan.riskLevel,
      createdAt: serverTimestamp()
    };
    await setDoc(newDocRef, taskData);
    await activityService.logAction(userId, 'task_created', 'task', newDocRef.id, data.title);
    return newDocRef.id;
  },

  updateTask: async (userId: string, taskId: string, data: Partial<Task>, currentTitle: string, currentTaskData?: Task) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    
    // Auto-calculate planning fields if deadline or duration changes
    let finalData = { ...data };
    if (currentTaskData) {
       const mergedDuration = data.estimatedDurationDays !== undefined ? data.estimatedDurationDays : currentTaskData.estimatedDurationDays;
       const mergedDeadline = data.deadline !== undefined ? data.deadline : currentTaskData.deadline;
       const dlDate = mergedDeadline ? new Date(mergedDeadline.toMillis()) : null;
       const plan = planningService.calculatePlanningFields(dlDate, mergedDuration || null);
       finalData = {
          ...finalData,
          suggestedStartDate: plan.suggestedStartDate ? Timestamp.fromDate(plan.suggestedStartDate) : null,
          bufferDays: plan.bufferDays,
          riskLevel: plan.riskLevel,
       };
    }

    await updateDoc(taskRef, finalData);
    await activityService.logAction(userId, 'task_updated', 'task', taskId, data.title || currentTitle);
  },

  completeTask: async (userId: string, taskId: string, title: string) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    
    await updateDoc(taskRef, {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    
    if (taskSnap.exists()) {
      const data = taskSnap.data() as Task;
      if (data.recurrence && data.recurrence !== 'none') {
        const nextDeadline = data.deadline ? new Date(data.deadline.toMillis()) : new Date();
        if (data.recurrence === 'daily') nextDeadline.setDate(nextDeadline.getDate() + 1);
        if (data.recurrence === 'weekly') nextDeadline.setDate(nextDeadline.getDate() + 7);
        if (data.recurrence === 'monthly') nextDeadline.setMonth(nextDeadline.getMonth() + 1);
        
        await taskService.createTask(userId, {
           title: data.title,
           category: data.category,
           priority: data.priority,
           deadline: Timestamp.fromDate(nextDeadline),
           notes: data.notes,
           documentIds: data.documentIds,
           tags: data.tags,
           recurrence: data.recurrence,
           estimatedDurationDays: data.estimatedDurationDays,
           intensity: data.intensity
        });
      }
    }

    await activityService.logAction(userId, 'task_completed', 'task', taskId, title);
  },

  deleteTask: async (userId: string, taskId: string, title: string) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
    await activityService.logAction(userId, 'task_deleted', 'task', taskId, title);
  }
};
