import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const updateOnboardingStatus = async (uid: string, displayName: string) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    displayName,
    onboardingDone: true
  }, { merge: true });
};
