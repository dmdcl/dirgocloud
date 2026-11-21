// Punto de entrada de /budget/. Guardia de sesión: hasta saber el estado de la
// sesión solo se ve "Cargando…"; sin sesión, solo el login.
import { onUserChanged, signInWithGoogle, signOut } from './auth.js';

const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const signinError = document.getElementById('signin-error');
const userEmail = document.getElementById('user-email');

// Muestra solo los elementos [data-auth] del estado actual: loading | out | in.
function render(state) {
  document.querySelectorAll('[data-auth]').forEach((el) => {
    el.hidden = el.dataset.auth !== state;
  });
}

onUserChanged((user) => {
  signinError.hidden = true;
  userEmail.textContent = user ? user.email ?? user.uid : '';
  render(user ? 'in' : 'out');
});

signinBtn.addEventListener('click', async () => {
  signinError.hidden = true;
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
