// ─────────────────────────────────────────────────────────────────────────────
// Firebase Configuration — AttendWise
// ─────────────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
//   1. Go to Firebase Console → Project Settings → Your Apps → Web App
//   2. Copy the firebaseConfig object and replace the placeholder values below.
//   3. Enable Authentication (Email/Password + Google) in the Firebase Console.
//   4. Enable Firestore Database and set the rules from firestore.rules.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from 'firebase/firestore';

// ⬇️  REPLACE these placeholder values with your real Firebase config
const firebaseConfig = {
  apiKey:            'AIzaSyB1K71BAl9V_kjnYWOSX0JX_iVDQyXKe4M',
  authDomain:        'attendwise-app.firebaseapp.com',
  projectId:         'attendwise-app',
  storageBucket:     'attendwise-app.firebasestorage.app',
  messagingSenderId: '327166577268',
  appId:             '1:327166577268:web:4b5d7128b77afa60615f21',
  measurementId:     'G-43F6RDFYDD',
};

// Singleton guard — avoid re-initialising on HMR
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);

  // Enable offline persistence (Firestore caches writes while offline and
  // syncs automatically when connectivity is restored)
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — persistence can only be enabled in one tab at a time
      console.warn('[AttendWise] Firestore persistence disabled: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support IndexedDB
      console.warn('[AttendWise] Firestore persistence not supported in this browser');
    }
  });
} else {
  app  = getApps()[0];
  auth = getAuth(app);
  db   = getFirestore(app);
}

export { app, auth, db };

/** Returns true if the Firebase config has been filled in (not placeholder) */
export const isFirebaseConfigured = (): boolean =>
  firebaseConfig.apiKey !== 'REPLACE_WITH_YOUR_API_KEY';
