// Interfaz del repositorio de datos. La UI solo usa un Repository:
// firestore-repository.js lo implementa con Firestore y el modo demo
// (módulo 7) lo implementará en memoria. Montos en centavos enteros de MXN.

/**
 * @typedef {'expense' | 'income'} EntryType
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} date             Fecha 'YYYY-MM-DD'.
 * @property {EntryType} type
 * @property {number} amount           Centavos, entero > 0.
 * @property {string | null} categoryId
 * @property {string} description      Hasta 200 caracteres ('' si no hay).
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name             De 1 a 40 caracteres.
 * @property {EntryType} type
 * @property {number} budget           Límite mensual en centavos, igual cada mes (0 = sin límite).
 */

/**
 * @typedef {Object} Repository
 * @property {(month: string) => Promise<Transaction[]>} listTransactions
 *   Movimientos del mes 'YYYY-MM', del más reciente al más antiguo.
 * @property {(data: Omit<Transaction, 'id'>) => Promise<string>} addTransaction  Devuelve el id nuevo.
 * @property {(id: string, data: Omit<Transaction, 'id'>) => Promise<void>} updateTransaction
 * @property {(id: string) => Promise<void>} deleteTransaction
 * @property {() => Promise<Category[]>} listCategories  Ordenadas por nombre.
 * @property {(data: Omit<Category, 'id'>) => Promise<string>} addCategory  Devuelve el id nuevo.
 * @property {(id: string, data: Omit<Category, 'id'>) => Promise<void>} updateCategory
 * @property {(id: string) => Promise<void>} deleteCategory
 */

export {};
