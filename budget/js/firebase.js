// Inicializa Firebase. En local (localhost / 127.0.0.1) usa el Emulator Suite;
// en cualquier otro host, el proyecto de js/firebase-config.js.
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from '../../js/firebase-config.js';

export const usingEmulators = ['localhost', '127.0.0.1'].includes(location.hostname);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (usingEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
