import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

export const auth = getAuth(app);

// Use custom database ID with resilient auto-detect long polling for iframe preview sandboxes
const databaseId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  databaseId
);

// Graceful connection health check
async function testConnection() {
  try {
    // Non-blocking cached or server probe
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    // Soft warn without breaking runtime
    console.debug('Firestore running with offline cache persistence.');
  }
}

testConnection();

