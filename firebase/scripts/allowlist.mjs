// Local dev only: adds allowlist/{uid} on the Firestore EMULATOR so that user
// can use /budget/. Usage (emulators running): npm run allowlist -- <uid>
// Writes with the emulator's "Bearer owner" token, which bypasses the rules and
// only exists on the emulator. Refuses non-demo projects and non-local hosts.
import { readFileSync } from 'node:fs';

const uid = process.argv[2];
if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
  console.error('Usage: npm run allowlist -- <uid>   (UID from the Auth emulator: http://127.0.0.1:4000/auth)');
  process.exit(1);
}

const projectId = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8')).projects.default;
if (!projectId.startsWith('demo-')) {
  console.error(`Refusing: project "${projectId}" is not a demo- project. This script is for the emulator only.`);
  process.exit(1);
}

const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  console.error(`Refusing: ${host} is not a local emulator.`);
  process.exit(1);
}

const url = `http://${host}/v1/projects/${projectId}/databases/(default)/documents/allowlist/${uid}`;
let res;
try {
  res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { note: { stringValue: 'local dev' } } }),
  });
} catch {
  console.error(`Could not reach the Firestore emulator at ${host}. Start it first: firebase emulators:start`);
  process.exit(1);
}
if (!res.ok) {
  console.error(`Failed (${res.status}): ${await res.text()}`);
  process.exit(1);
}
console.log(`Added allowlist/${uid} on the emulator (${projectId}).`);
