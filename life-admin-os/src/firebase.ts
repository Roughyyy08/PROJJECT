import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase config from environment variables
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Try to load config from file as fallback
let fileConfig: any = {};
try {
  fileConfig = await import('../firebase-applet-config.json');
} catch (e) {
  // Config file not found
}

// Merge configs - env takes precedence
const firebaseConfig = {
  apiKey: envConfig.apiKey || fileConfig.default?.apiKey || '',
  authDomain: envConfig.authDomain || fileConfig.default?.authDomain || '',
  projectId: envConfig.projectId || fileConfig.default?.projectId || '',
  storageBucket: envConfig.storageBucket || fileConfig.default?.storageBucket || '',
  messagingSenderId: envConfig.messagingSenderId || fileConfig.default?.messagingSenderId || '',
  appId: envConfig.appId || fileConfig.default?.appId || ''
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let db: Firestore | null = null;

// Check if we have valid config
const hasValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

if (hasValidConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    storage = getStorage(app);
    
    // Use custom database ID if provided in config, but only use fileConfig's if the project ID matches
    const useFileDbId = fileConfig.default?.projectId === firebaseConfig.projectId;
    const dbId = import.meta.env.VITE_FIREBASE_DB_ID || (useFileDbId ? fileConfig.default?.firestoreDatabaseId : undefined);
    db = dbId && dbId !== '(optional)' ? getFirestore(app, dbId) : getFirestore(app);
    
    console.log('Firebase initialized with project:', firebaseConfig.projectId);
  } catch (error: any) {
    console.error('Firebase initialization error:', error.code, error.message);
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.error('Firebase not configured. Missing API key or Project ID in .env');
  auth = null;
  db = null;
  storage = null;
}

export { app, auth, storage, db };
export const firebaseInitialized = hasValidConfig;