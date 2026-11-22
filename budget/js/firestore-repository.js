// Repository sobre Firestore: users/{uid}/transactions y users/{uid}/categories.
// Las reglas (firebase/firestore.rules) validan cada escritura.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} uid
 * @returns {import('./repository.js').Repository}
 */
export function createFirestoreRepository(db, uid) {
  const transactions = collection(db, 'users', uid, 'transactions');
  const categories = collection(db, 'users', uid, 'categories');

  return {
    async listTransactions(month) {
      const snap = await getDocs(query(
        transactions,
        where('date', '>=', `${month}-01`),
        where('date', '<=', `${month}-31`),
        orderBy('date', 'desc'),
      ));
      return snap.docs.map((d) => ({ id: d.id, ...pickTransaction(d.data()) }));
    },
    async addTransaction(data) {
      return (await addDoc(transactions, pickTransaction(data))).id;
    },
    async updateTransaction(id, data) {
      await setDoc(doc(transactions, id), pickTransaction(data));
    },
    async deleteTransaction(id) {
      await deleteDoc(doc(transactions, id));
    },

    async listCategories() {
      const snap = await getDocs(categories);
      return snap.docs
        .map((d) => ({ id: d.id, ...pickCategory(d.data()) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },
    async addCategory(data) {
      return (await addDoc(categories, pickCategory(data))).id;
    },
    async updateCategory(id, data) {
      await setDoc(doc(categories, id), pickCategory(data));
    },
    async deleteCategory(id) {
      await deleteDoc(doc(categories, id));
    },
  };
}

// Solo los campos del modelo, con sus valores por defecto: así un objeto con
// `id` u otros campos de la UI no hace fallar las reglas.
function pickTransaction({ date, type, amount, categoryId = null, description = '' }) {
  return { date, type, amount, categoryId, description };
}

function pickCategory({ name, type, budget = 0 }) {
  return { name, type, budget };
}
