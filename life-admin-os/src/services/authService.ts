import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const authService = {
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create or update user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || 'New User',
          onboardingDone: false,
          vaultUsedBytes: 0,
          createdAt: serverTimestamp()
        });
        console.log('Created new user document');
      } else {
        console.log('User already exists');
      }
      
      return user;
    } catch (error: any) {
      console.error('Google Login error:', error.code, error.message);
      throw error;
    }
  },

  signInWithEmail: async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  },

  signUpWithEmail: async (email: string, pass: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    
    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        displayName: user.email?.split('@')[0] || 'New User',
        onboardingDone: false,
        vaultUsedBytes: 0,
        createdAt: serverTimestamp()
      });
    }
    
    return user;
  },

  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },
  
  logout: async () => {
    await signOut(auth);
  }
};