import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export type ActivityAction = 'task_created' | 'task_completed' | 'task_deleted' | 'task_updated' | 'document_uploaded' | 'document_deleted';
export type EntityType = 'task' | 'document';

export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  createdAt: any; 
}

export const activityService = {
  logAction: async (userId: string, action: ActivityAction, entityType: EntityType, entityId: string, entityName: string) => {
    try {
      const logRef = collection(db, 'users', userId, 'activityLog');
      await addDoc(logRef, {
        userId,
        action,
        entityType,
        entityId,
        entityName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
      // Suppress activity log failures so they don't break the main flow
    }
  },

  getRecentLogs: async (userId: string, maxResults = 50): Promise<ActivityLog[]> => {
    const logRef = collection(db, 'users', userId, 'activityLog');
    const q = query(logRef, orderBy('createdAt', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
  }
};
