// Firestore rules tests for the budget app, run on the Firestore emulator.
// Run from firebase/: npm test. The script passes the system Node's full path
// because the standalone firebase binary puts its own Node 20 first on PATH.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const TX = { date: '2026-11-21', type: 'expense', amount: 12550, categoryId: 'food', description: 'Súper' };
const CATEGORY = { name: 'Comida', type: 'expense', budget: 400000 };

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-dirgocloud',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(() => env.cleanup());
// Fake UIDs only. alice and bob are on the allowlist; carol is not.
beforeEach(async () => {
  await env.clearFirestore();
  await seed('allowlist/alice', { note: 'test' });
  await seed('allowlist/bob', { note: 'test' });
});

// Firestore as a signed-in user (uid) or signed out (no uid).
const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

// Writes a document with the rules disabled (test setup).
const seed = (path, data) =>
  env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), path), data));

const monthQuery = (firestore, uid) =>
  query(
    collection(firestore, 'users', uid, 'transactions'),
    where('date', '>=', '2026-11-01'),
    where('date', '<=', '2026-11-31'),
    orderBy('date', 'desc'),
  );

describe('owner', () => {
  test('can create, read, update and delete a transaction', async () => {
    const ref = doc(db('alice'), 'users/alice/transactions/t1');
    await assertSucceeds(setDoc(ref, TX));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { amount: 9900 }));
    await assertSucceeds(setDoc(ref, { ...TX, type: 'income' })); // full replace, as the repository does
    await assertSucceeds(deleteDoc(ref));
  });

  test('can create, read, update and delete a category', async () => {
    const ref = doc(db('alice'), 'users/alice/categories/c1');
    await assertSucceeds(setDoc(ref, CATEGORY));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { budget: 0 }));
    await assertSucceeds(setDoc(ref, { ...CATEGORY, name: 'Súper' })); // full replace
    await assertSucceeds(deleteDoc(ref));
  });

  test('can save a transaction without the optional fields, or with no category', async () => {
    const alice = db('alice');
    await assertSucceeds(setDoc(doc(alice, 'users/alice/transactions/t1'), { date: TX.date, type: 'income', amount: 1 }));
    await assertSucceeds(setDoc(doc(alice, 'users/alice/transactions/t2'), { ...TX, categoryId: null, description: '' }));
  });

  test('can list one month of transactions, newest first', async () => {
    await seed('users/alice/transactions/t1', TX);
    await seed('users/alice/transactions/t2', { ...TX, date: '2026-11-02' });
    await seed('users/alice/transactions/t3', { ...TX, date: '2026-10-31' });
    const snap = await assertSucceeds(getDocs(monthQuery(db('alice'), 'alice')));
    assert.deepEqual(snap.docs.map((d) => d.id), ['t1', 't2']);
  });
});

describe('isolation', () => {
  test('signed-out users can not read or write', async () => {
    await seed('users/alice/transactions/t1', TX);
    const anon = db();
    await assertFails(getDoc(doc(anon, 'users/alice/transactions/t1')));
    await assertFails(getDocs(collection(anon, 'users/alice/categories')));
    await assertFails(setDoc(doc(anon, 'users/alice/transactions/t2'), TX));
  });

  test("another user can not read, list, write or delete the owner's data", async () => {
    await seed('users/alice/transactions/t1', TX);
    await seed('users/alice/categories/c1', CATEGORY);
    const bob = db('bob');
    await assertFails(getDoc(doc(bob, 'users/alice/transactions/t1')));
    await assertFails(getDocs(monthQuery(bob, 'alice')));
    await assertFails(setDoc(doc(bob, 'users/alice/transactions/t2'), TX));
    await assertFails(updateDoc(doc(bob, 'users/alice/transactions/t1'), { amount: 1 }));
    await assertFails(deleteDoc(doc(bob, 'users/alice/transactions/t1')));
    await assertFails(getDocs(collection(bob, 'users/alice/categories')));
    await assertFails(setDoc(doc(bob, 'users/alice/categories/c2'), CATEGORY));
    await assertFails(deleteDoc(doc(bob, 'users/alice/categories/c1')));
  });

  test('the users/{uid} document and any other path are denied', async () => {
    const alice = db('alice');
    await assertFails(setDoc(doc(alice, 'users/alice'), { name: 'Alice' }));
    await assertFails(getDoc(doc(alice, 'users/alice')));
    await assertFails(setDoc(doc(alice, 'users/alice/notes/n1'), { text: 'x' }));
    await assertFails(setDoc(doc(alice, 'shared/s1'), { text: 'x' }));
  });
});

describe('allowlist', () => {
  test('a signed-in user not on the allowlist can not read or write their own data', async () => {
    await seed('users/carol/transactions/t1', TX);
    await seed('users/carol/categories/c1', CATEGORY);
    const carol = db('carol');
    await assertFails(getDoc(doc(carol, 'users/carol/transactions/t1')));
    await assertFails(getDocs(monthQuery(carol, 'carol')));
    await assertFails(setDoc(doc(carol, 'users/carol/transactions/t2'), TX));
    await assertFails(updateDoc(doc(carol, 'users/carol/transactions/t1'), { amount: 1 }));
    await assertFails(deleteDoc(doc(carol, 'users/carol/transactions/t1')));
    await assertFails(getDocs(collection(carol, 'users/carol/categories')));
    await assertFails(setDoc(doc(carol, 'users/carol/categories/c2'), CATEGORY));
    await assertFails(deleteDoc(doc(carol, 'users/carol/categories/c1')));
  });

  test('removing a user from the allowlist cuts off access', async () => {
    await seed('users/alice/transactions/t1', TX);
    const ref = doc(db('alice'), 'users/alice/transactions/t1');
    await assertSucceeds(getDoc(ref));
    await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), 'allowlist/alice')));
    await assertFails(getDoc(ref));
  });

  test('an allowlisted user can not read, list or change any allowlist doc, even their own', async () => {
    const alice = db('alice');
    await assertFails(getDoc(doc(alice, 'allowlist/alice')));
    await assertFails(getDoc(doc(alice, 'allowlist/bob')));
    await assertFails(getDocs(collection(alice, 'allowlist')));
    await assertFails(setDoc(doc(alice, 'allowlist/alice'), { note: 'x' }));
    await assertFails(updateDoc(doc(alice, 'allowlist/alice'), { note: 'x' }));
    await assertFails(deleteDoc(doc(alice, 'allowlist/alice')));
    await assertFails(setDoc(doc(alice, 'allowlist/carol'), { note: 'x' }));
  });

  test('users not on the list and signed-out users can not add or read allowlist docs', async () => {
    await assertFails(setDoc(doc(db('carol'), 'allowlist/carol'), { note: 'x' }));
    await assertFails(getDoc(doc(db('carol'), 'allowlist/carol')));
    await assertFails(getDoc(doc(db(), 'allowlist/alice')));
    await assertFails(getDocs(collection(db(), 'allowlist')));
    await assertFails(setDoc(doc(db(), 'allowlist/dave'), { note: 'x' }));
  });
});

describe('validation', () => {
  const badTransactions = {
    'date not YYYY-MM-DD': { ...TX, date: '21/11/2026' },
    'date not a string': { ...TX, date: 20261121 },
    'unknown type': { ...TX, type: 'transfer' },
    'zero amount': { ...TX, amount: 0 },
    'negative amount': { ...TX, amount: -100 },
    'amount with decimals': { ...TX, amount: 125.5 },
    'amount as text': { ...TX, amount: '12550' },
    'amount over the limit': { ...TX, amount: 100000000001 },
    'missing amount': { date: TX.date, type: TX.type },
    'empty categoryId': { ...TX, categoryId: '' },
    'description over 200 chars': { ...TX, description: 'x'.repeat(201) },
    'unknown field': { ...TX, extra: true },
  };
  for (const [name, data] of Object.entries(badTransactions)) {
    test(`rejects a transaction with ${name}`, async () => {
      await assertFails(setDoc(doc(db('alice'), 'users/alice/transactions/t1'), data));
    });
  }

  test('rejects an update that leaves an invalid transaction', async () => {
    await seed('users/alice/transactions/t1', TX);
    await assertFails(updateDoc(doc(db('alice'), 'users/alice/transactions/t1'), { amount: -1 }));
  });

  const badCategories = {
    'empty name': { ...CATEGORY, name: '' },
    'name over 40 chars': { ...CATEGORY, name: 'x'.repeat(41) },
    'unknown type': { ...CATEGORY, type: 'savings' },
    'negative budget': { ...CATEGORY, budget: -1 },
    'budget with decimals': { ...CATEGORY, budget: 10.5 },
    'missing budget': { name: CATEGORY.name, type: CATEGORY.type },
    'unknown field': { ...CATEGORY, color: 'red' },
  };
  for (const [name, data] of Object.entries(badCategories)) {
    test(`rejects a category with ${name}`, async () => {
      await assertFails(setDoc(doc(db('alice'), 'users/alice/categories/c1'), data));
    });
  }
});
