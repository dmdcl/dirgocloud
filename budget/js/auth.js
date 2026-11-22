// Autenticación con Google. La UI usa solo este módulo, nunca Firebase Auth directo.
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase.js';

// Abre el popup de Google. Cerrar o reemplazar el popup no cuenta como error.
export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
    throw err;
  }
}

export function signOut() {
  return firebaseSignOut(auth);
}

// Llama a callback con { uid, email } o null, al cargar y en cada cambio de sesión.
export function onUserChanged(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user && { uid: user.uid, email: user.email });
  });
}
