// Respaldo JSON de todos los datos del usuario. No usa Firebase: el repositorio
// lee los datos y aquí se arma, se comprueba y se descarga el archivo. La huella
// (SHA-256) se calcula sobre un JSON canónico de "data" (claves ordenadas, sin
// espacios), así no depende de cómo esté formateado el archivo. Nada se sube.
import { timestampMX } from './dates.js';

export const BACKUP_FORMAT = 'dirgocloud-budget-backup';
export const BACKUP_VERSION = 1;
const COLLECTIONS = ['accounts', 'transactions', 'categories', 'settings'];

/** JSON sin espacios y con las claves de cada objeto ordenadas. */
export function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** SHA-256 en hexadecimal del texto en UTF-8. */
export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Arma el archivo de respaldo.
 * @param {{ uid: string, data: Object<string, Array<{ id: string }>>, schemaVersion?: number, now?: Date }} input
 * @returns {Promise<{ name: string, text: string, sha256: string, summary: Object }>}
 */
export async function buildBackup({ uid, data, schemaVersion = 1, now = new Date() }) {
  // Orden fijo por id y solo valores JSON: la huella sale igual al releer el archivo.
  const sorted = Object.fromEntries(COLLECTIONS.map((name) => [name, sortById(data[name] ?? [])]));
  const plain = JSON.parse(JSON.stringify(sorted));
  const sha256 = await sha256Hex(canonicalJSON(plain));
  const summary = summarize(plain);
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion,
    exportedAt: now.toISOString(),
    uid,
    summary,
    sha256,
    data: plain,
  };
  return {
    name: `presupuesto-respaldo-${timestampMX(now)}.json`,
    text: `${JSON.stringify(backup, null, 2)}\n`,
    sha256,
    summary,
  };
}

/**
 * Lee y comprueba un respaldo: formato, versión, cuenta, huella y resumen.
 * @param {string} text
 * @param {{ uid?: string }} [expected] uid: rechaza respaldos de otra cuenta.
 * @returns {Promise<{ ok: true, backup: Object, sha256: string } | { ok: false, reason: string }>}
 */
export async function parseBackup(text, { uid } = {}) {
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'El archivo no es un JSON válido (¿descarga incompleta?).' };
  }
  if (backup?.format !== BACKUP_FORMAT) return { ok: false, reason: 'El archivo no es un respaldo de esta app.' };
  if (backup.version !== BACKUP_VERSION) {
    return { ok: false, reason: `Versión de respaldo no compatible: ${backup.version}.` };
  }
  if (uid && backup.uid !== uid) return { ok: false, reason: 'El respaldo es de otra cuenta.' };
  const { data } = backup;
  if (!data || !COLLECTIONS.every((name) => Array.isArray(data[name]))) {
    return { ok: false, reason: 'Al respaldo le faltan datos.' };
  }
  const sha256 = await sha256Hex(canonicalJSON(data));
  if (sha256 !== backup.sha256) {
    return { ok: false, reason: 'El respaldo está incompleto o fue modificado (la huella no coincide).' };
  }
  if (canonicalJSON(summarize(data)) !== canonicalJSON(backup.summary)) {
    return { ok: false, reason: 'El resumen del respaldo no coincide con sus datos.' };
  }
  return { ok: true, backup, sha256 };
}

/**
 * Lee del servidor todos los datos del usuario y arma el respaldo (sin descargarlo).
 * @param {import('./repository.js').Repository} repo
 * @param {string} uid
 */
export async function createBackup(repo, uid) {
  return buildBackup({ uid, data: await repo.exportData() });
}

/** Descarga un texto como archivo local del dispositivo. No lo sube a ningún lado. */
export function downloadText(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000); // Safari necesita la URL viva un rato.
}

function sortById(docs) {
  return [...docs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// Totales para revisar el respaldo a simple vista (y en A1c, el antes/después de migrar).
function summarize(data) {
  let income = 0;
  let expense = 0;
  for (const tx of data.transactions) {
    if (!Number.isInteger(tx.amount)) continue;
    if (tx.type === 'income') income += tx.amount;
    if (tx.type === 'expense') expense += tx.amount;
  }
  const balance = data.accounts.reduce((sum, a) => sum + (Number.isInteger(a.balance) ? a.balance : 0), 0);
  return {
    transactions: { count: data.transactions.length, income, expense },
    accounts: { count: data.accounts.length, balance },
    categories: { count: data.categories.length },
    settings: { count: data.settings.length },
  };
}
