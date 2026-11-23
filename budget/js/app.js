// Punto de entrada de /budget/. Guardia de sesión: hasta saber el estado de la
// sesión solo se ve "Cargando…"; sin sesión, solo el login.
import { onUserChanged, signInWithGoogle, signOut } from './auth.js';
import { createBackup, downloadText } from './backup.js';
import { db } from './firebase.js';
import { createFirestoreRepository } from './firestore-repository.js';
import { startTransactions, stopTransactions } from './transactions.js';

const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const signinError = document.getElementById('signin-error');
const userEmail = document.getElementById('user-email');
const backupBtn = document.getElementById('backup-btn');
const backupStatus = document.getElementById('backup-status');

// Aviso para la vista de login que debe sobrevivir al cierre de sesión.
let loginNotice = '';
// Sesión actual: { uid, repo } del usuario, o null sin sesión.
let session = null;

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
  session = user ? { uid: user.uid, repo: createFirestoreRepository(db, user.uid) } : null;
  backupStatus.textContent = '';
  if (session) startTransactions(session.repo, { onDenied: denyAccess });
  else stopTransactions();
  render(user ? 'in' : 'out');
});

// Respaldo: se arma en el navegador con datos del servidor y se descarga como
// archivo local; no se sube nada.
backupBtn.addEventListener('click', async () => {
  if (!session) return;
  const { uid, repo } = session;
  backupBtn.disabled = true;
  backupStatus.textContent = 'Preparando el respaldo…';
  try {
    const { name, text, summary } = await createBackup(repo, uid);
    if (session?.uid !== uid) return; // Cerró sesión mientras tanto: no descargar.
    downloadText(name, text);
    backupStatus.textContent =
      `Descargado: ${name} (${summary.transactions.count} movimientos). Guárdalo en un lugar seguro.`;
  } catch (err) {
    console.error(err);
    if (session?.uid === uid) {
      backupStatus.textContent = 'No se pudo crear el respaldo. Revisa tu conexión e inténtalo de nuevo.';
    }
  } finally {
    backupBtn.disabled = false;
  }
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
