// /lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log Firebase config for debugging (remove in production)
console.log("Firebase config:", {
  apiKey: firebaseConfig.apiKey ? "***" : "missing",
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? "***" : "missing",
  measurementId: firebaseConfig.measurementId,
});

// Initialize Firebase
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, rtdb, googleProvider };