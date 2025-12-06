
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';

// The full Firebase JS SDK
export {
  onAuthStateChanged,
  connectAuthEmulator,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
export {
  connectFirestoreEmulator,
  getDoc,
  doc,
  collection,
  onSnapshot,
  serverTimestamp,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;


export function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (getApps().length) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app);
  firestore = getFirestore(app);
  return { app, auth, firestore };
}


export { app, auth, firestore };

export * from './provider';
export * from './hooks';
export * from './auth/use-user';
