// Punto de entrada de /budget/. Guardia de sesión: hasta saber el estado de la
// sesión solo se ve "Cargando…"; sin sesión, solo el login.
import { onUserChanged, signInWithGoogle, signOut } from './auth.js';
import { db } from './firebase.js';
import { createFirestoreRepository } from './firestore-repository.js';
import { startTransactions, stopTransactions } from './transactions.js';

const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const signinError = document.getElementById('signin-error');
const userEmail = document.getElementById('user-email');

// Aviso para la vista de login que debe sobrevivir al cierre de sesión.
let loginNotice = '';

// Muestra solo los elementos [data-auth] del estado actual: loading | out | in.
function render(state) {
  document.querySelectorAll('[data-auth]').forEach((el) => {
    el.hidden = el.dataset.auth !== state;
  });
}

// Las reglas rechazan a quien no está en la lista de acceso: avisar y salir.
function denyAccess() {
  loginNotice = 'Cuenta no autorizada.';
  signOut();
}

onUserChanged((user) => {
  signinError.textContent = user ? '' : loginNotice;
  signinError.hidden = !signinError.textContent;
  loginNotice = '';
  userEmail.textContent = user ? user.email ?? user.uid : '';
  if (user) startTransactions(createFirestoreRepository(db, user.uid), { onDenied: denyAccess });
  else stopTransactions();
  render(user ? 'in' : 'out');
});

signinBtn.addEventListener('click', async () => {
  signinError.hidden = true;
  loginNotice = '';
  try {
    await signInWithGoogle();
  } catch (err) {
    console.error(err);
    signinError.textContent =
      'No se pudo iniciar sesión. Revisa que el navegador permita ventanas emergentes e inténtalo de nuevo.';
    signinError.hidden = false;
  }
});

signoutBtn.addEventListener('click', () => signOut());
