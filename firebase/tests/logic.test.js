// Unit tests for the budget app's pure logic (budget/js, no DOM, no Firebase).
// They don't need the emulator; npm test runs them with the rules tests.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { BACKUP_FORMAT, buildBackup, canonicalJSON, parseBackup, sha256Hex } from '../../budget/js/backup.js';
import { shiftMonth, timestampMX, todayMX } from '../../budget/js/dates.js';

describe('todayMX: the date in America/Mexico_City', () => {
  test('uses the Mexico City date, not the UTC date', () => {
    // 23:59:59 in Mexico City is already the next day in UTC.
    assert.equal(todayMX(new Date('2026-11-23T05:59:59Z')), '2026-11-22');
    assert.equal(todayMX(new Date('2026-11-23T06:00:00Z')), '2026-11-23');
  });

  test('changes year at Mexico City midnight', () => {
    assert.equal(todayMX(new Date('2027-01-01T05:59:59Z')), '2026-12-31');
    assert.equal(todayMX(new Date('2027-01-01T06:00:00Z')), '2027-01-01');
  });

  test('stays UTC-6 in summer (no daylight saving time since 2022)', () => {
    assert.equal(todayMX(new Date('2026-07-01T05:30:00Z')), '2026-06-30');
    assert.equal(todayMX(new Date('2026-07-01T06:00:00Z')), '2026-07-01');
  });

  test('defaults to the current instant', () => {
    assert.match(todayMX(), /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  });
});

describe('shiftMonth', () => {
  test('moves forward and backward, across years', () => {
    assert.equal(shiftMonth('2026-11', 0), '2026-11');
    assert.equal(shiftMonth('2026-11', 1), '2026-12');
    assert.equal(shiftMonth('2026-12', 1), '2027-01');
    assert.equal(shiftMonth('2026-01', -1), '2025-12');
    assert.equal(shiftMonth('2026-11', 12), '2027-11');
    assert.equal(shiftMonth('2026-03', -14), '2025-01');
  });
});

describe('timestampMX', () => {
  test('is YYYY-MM-DD-HHmm in Mexico City, with hours 00-23', () => {
    assert.equal(timestampMX(new Date('2026-11-22T19:40:30Z')), '2026-11-22-1340');
    assert.equal(timestampMX(new Date('2026-11-23T05:59:00Z')), '2026-11-22-2359');
    assert.equal(timestampMX(new Date('2026-11-23T06:00:00Z')), '2026-11-23-0000');
  });
});

describe('backup file', () => {
  const UID = 'test-uid';
  const NOW = new Date('2026-11-22T19:40:00Z');
  const DATA = {
    transactions: [
      { id: 't2', date: '2026-11-02', type: 'expense', amount: 12550, categoryId: null, description: 'Súper' },
      { id: 't1', date: '2026-11-01', type: 'income', amount: 2500000, categoryId: 'c1', description: 'Sueldo' },
    ],
    categories: [{ id: 'c1', name: 'Sueldo', type: 'income', budget: 0 }],
  };

  test('canonicalJSON sorts keys at every level and keeps array order', () => {
    assert.equal(canonicalJSON({ b: 1, a: { d: [2, 1], c: null } }), '{"a":{"c":null,"d":[2,1]},"b":1}');
    assert.equal(canonicalJSON({ a: 'x', b: 2 }), canonicalJSON({ b: 2, a: 'x' }));
  });

  test('sha256Hex matches the standard test vectors', async () => {
    assert.equal(await sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  test('buildBackup writes the header, every collection sorted by id, a summary and the hash', async () => {
    const { name, text, sha256, summary } = await buildBackup({ uid: UID, data: DATA, now: NOW });
    assert.equal(name, 'presupuesto-respaldo-2026-11-22-1340.json');
    const file = JSON.parse(text);
    assert.equal(file.format, BACKUP_FORMAT);
    assert.equal(file.version, 1);
    assert.equal(file.schemaVersion, 1);
    assert.equal(file.exportedAt, '2026-11-22T19:40:00.000Z');
    assert.equal(file.uid, UID);
    assert.deepEqual(Object.keys(file.data), ['accounts', 'transactions', 'categories', 'settings']);
    assert.deepEqual(file.data.transactions.map((t) => t.id), ['t1', 't2']);
    assert.deepEqual(file.data.accounts, []);
    assert.deepEqual(file.data.settings, []);
    assert.deepEqual(summary, {
      transactions: { count: 2, income: 2500000, expense: 12550 },
      accounts: { count: 0, balance: 0 },
      categories: { count: 1 },
      settings: { count: 0 },
    });
    assert.deepEqual(file.summary, summary);
    assert.equal(file.sha256, sha256);
    assert.equal(sha256, await sha256Hex(canonicalJSON(file.data)));
    assert.ok(text.endsWith('}\n'));
  });

  test('parseBackup accepts its own file, even re-formatted', async () => {
    const { text, sha256 } = await buildBackup({ uid: UID, data: DATA, now: NOW });
    const parsed = await parseBackup(text, { uid: UID });
    assert.equal(parsed.ok, true);
    assert.equal(parsed.sha256, sha256);
    const compact = JSON.stringify(JSON.parse(text));
    assert.equal((await parseBackup(compact, { uid: UID })).ok, true);
  });

  test('parseBackup rejects a truncated, foreign, altered or wrong-format file', async () => {
    const { text } = await buildBackup({ uid: UID, data: DATA, now: NOW });
    const file = JSON.parse(text);
    const rejects = async (t, expected = { uid: UID }) => assert.equal((await parseBackup(t, expected)).ok, false);
    await rejects(text.slice(0, Math.floor(text.length / 2))); // half-written download
    await rejects(text, { uid: 'another-uid' });
    await rejects(text.replace('"amount": 12550', '"amount": 12551'));
    await rejects(JSON.stringify({ ...file, format: 'something-else' }));
    await rejects(JSON.stringify({ ...file, version: 2 }));
    await rejects(JSON.stringify({ ...file, data: { ...file.data, categories: undefined } }));
    await rejects(JSON.stringify({ ...file, summary: { ...file.summary, transactions: { count: 9, income: 0, expense: 0 } } }));
  });
});
