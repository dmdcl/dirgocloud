// Repository sobre Firestore: users/{uid}/transactions y users/{uid}/categories.
// Las reglas (firebase/firestore.rules) validan cada escritura.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
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
    // Un listener por mes: tras la primera lectura, cada cambio cuesta solo los
    // documentos que cambian, en vez de volver a leer el mes completo.
    watchTransactions(month, onChange, onError) {
      const monthQuery = query(
        transactions,
        where('date', '>=', `${month}-01`),
        where('date', '<=', `${month}-31`),
        orderBy('date', 'desc'),
      );
      return onSnapshot(
        monthQuery,
        (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...pickTransaction(d.data()) }))),
        onError,
      );
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

    // Todo lo del usuario tal como está guardado, leído del servidor (no de la
    // caché; sin conexión falla). accounts y settings llegan con A1c: las reglas
    // actuales no permiten que existan, así que van vacíos.
    async exportData() {
      const [tx, cats] = await Promise.all([getDocsFromServer(transactions), getDocsFromServer(categories)]);
      return { accounts: [], transactions: rawDocs(tx), categories: rawDocs(cats), settings: [] };
    },
  };
}

// { id, ...campos } sin filtrar: el respaldo guarda cada documento tal cual.
function rawDocs(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Solo los campos del modelo, con sus valores por defecto: así un objeto con
// `id` u otros campos de la UI no hace fallar las reglas.
function pickTransaction({ date, type, amount, categoryId = null, description = '' }) {
  return { date, type, amount, categoryId, description };
}

function pickCategory({ name, type, budget = 0 }) {
  return { name, type, budget };
}
