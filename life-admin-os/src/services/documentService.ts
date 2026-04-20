import { collection, doc, setDoc, deleteDoc, query, onSnapshot, serverTimestamp, Timestamp, runTransaction } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { activityService } from './activityService';
import { taskService } from './taskService';

export type DocType = 'ID' | 'Certificate' | 'Insurance' | 'Financial' | 'Other';

export interface DocumentMeta {
  id: string;
  userId: string;
  name: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  docType: DocType;
  expiryDate: Timestamp | null;
  tags?: string[];
  createdAt: Timestamp;
}

export const documentService = {
  subscribeToDocuments: (userId: string, callback: (docs: DocumentMeta[]) => void) => {
    const q = query(collection(db, 'users', userId, 'documents'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DocumentMeta));
      callback(docs);
    });
  },

  subscribeToVaultUsage: (userId: string, callback: (bytes: number) => void) => {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().vaultUsedBytes) {
        callback(docSnap.data().vaultUsedBytes);
      } else {
        callback(0);
      }
    });
  },

  uploadDocument: (
    userId: string, 
    file: File, 
    docType: DocType, 
    expiryDate: Date | null,
    tags: string[],
    onProgress: (progress: number) => void
  ): Promise<DocumentMeta> => {
    return new Promise((resolve, reject) => {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        reject(new Error('File too large. Maximum size is 10 MB.'));
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('File type not supported. Please upload PDF, JPG, PNG, or WEBP files.'));
        return;
      }

      // First check quota
      const userRef = doc(db, 'users', userId);
      
      runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentBytes = userDoc.exists() ? (userDoc.data().vaultUsedBytes || 0) : 0;
        
        if (currentBytes + file.size > 500 * 1024 * 1024) {
          throw new Error('Vault storage limit reached (500 MB). Delete documents to free space.');
        }

        // Add to quota preemptively; we can revert if upload fails
        transaction.set(userRef, {
          vaultUsedBytes: currentBytes + file.size
        }, { merge: true });
        
        return true; 
      }).then(() => {
         const newDocRef = doc(collection(db, 'users', userId, 'documents'));
         const storagePath = `users/${userId}/documents/${newDocRef.id}/${file.name}`;
         const storageRef = ref(storage, storagePath);
         
         const uploadTask = uploadBytesResumable(storageRef, file);
         
         uploadTask.on('state_changed', 
            (snapshot) => {
               const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
               onProgress(progress);
            },
            async (error) => {
               // Revert quota on error
               await runTransaction(db, async (t) => {
                 const uDoc = await t.get(userRef);
                 const cBytes = uDoc.exists() ? (uDoc.data().vaultUsedBytes || 0) : 0;
                 t.set(userRef, { vaultUsedBytes: Math.max(0, cBytes - file.size) }, { merge: true });
               });
               reject(new Error('Upload failed. Check your connection and try again.'));
            },
            async () => {
               const docData = {
                  id: newDocRef.id,
                  userId,
                  name: file.name,
                  storagePath,
                  mimeType: file.type,
                  sizeBytes: file.size,
                  docType,
                  expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
                  tags,
                  createdAt: serverTimestamp()
               };
               
               await setDoc(newDocRef, docData);
               await activityService.logAction(userId, 'document_uploaded', 'document', newDocRef.id, file.name);
               
               // Auto-create task if expiry date is provided
               if (expiryDate) {
                  try {
                    await taskService.createTask(userId, {
                      title: `Renew Asset: ${file.name}`,
                      category: 'Personal',
                      priority: 'High',
                      deadline: Timestamp.fromDate(expiryDate),
                      notes: 'Auto-generated from document expiry tracking.',
                      documentIds: [newDocRef.id],
                      recurrence: 'none',
                      tags
                    });
                  } catch (taskErr) {
                    console.error('Failed to auto-create task for document expiry', taskErr);
                  }
               }
               
               resolve(docData as unknown as DocumentMeta); // Approximate, timestamps won't be fully resolved immediately locally
            }
         );
      }).catch(err => reject(err));
    });
  },

  getDownloadUrl: async (storagePath: string): Promise<string> => {
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
  },

  deleteDocument: async (userId: string, documentId: string, storagePath: string, sizeBytes: number, name: string) => {
    const userRef = doc(db, 'users', userId);
    const docRef = doc(db, 'users', userId, 'documents', documentId);
    const storageRef = ref(storage, storagePath);

    // Delete from Firestore, adjust quota, log activity
    await runTransaction(db, async (t) => {
       const uDoc = await t.get(userRef);
       const cBytes = uDoc.exists() ? (uDoc.data().vaultUsedBytes || 0) : 0;
       t.delete(docRef);
       t.set(userRef, { vaultUsedBytes: Math.max(0, cBytes - sizeBytes) }, { merge: true });
    });

    // Delete from Storage
    try {
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("Storage object already deleted or failed to delete.", err);
    }
    
    await activityService.logAction(userId, 'document_deleted', 'document', documentId, name);
  }
};
