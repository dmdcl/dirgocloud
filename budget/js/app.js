// Punto de entrada de /budget/.
import { app, usingEmulators } from './firebase.js';

const status = document.getElementById('budget-status');

status.textContent = usingEmulators
  ? `Conectado a los emuladores locales (${app.options.projectId}).`
  : `Proyecto: ${app.options.projectId}.`;
