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
 * @typedef {Object} BackupData  Documentos del usuario tal como están guardados,
 *   cada uno como { id, ...campos }.
 * @property {Array<{ id: string }>} accounts
 * @property {Array<{ id: string }>} transactions
 * @property {Array<{ id: string }>} categories
 * @property {Array<{ id: string }>} settings
 */

/**
 * @typedef {Object} Repository
 * @property {(month: string, onChange: (items: Transaction[]) => void, onError: (err: Error) => void) => () => void} watchTransactions
 *   Escucha los movimientos del mes 'YYYY-MM', del más reciente al más antiguo:
 *   llama a onChange con la lista completa al inicio y tras cada cambio (de este
 *   u otro dispositivo). Devuelve la función que deja de escuchar.
 * @property {(data: Omit<Transaction, 'id'>) => Promise<string>} addTransaction  Devuelve el id nuevo.
 * @property {(id: string, data: Omit<Transaction, 'id'>) => Promise<void>} updateTransaction
 * @property {(id: string) => Promise<void>} deleteTransaction
 * @property {() => Promise<Category[]>} listCategories  Ordenadas por nombre.
 * @property {(data: Omit<Category, 'id'>) => Promise<string>} addCategory  Devuelve el id nuevo.
 * @property {(id: string, data: Omit<Category, 'id'>) => Promise<void>} updateCategory
 * @property {(id: string) => Promise<void>} deleteCategory
 * @property {() => Promise<BackupData>} exportData
 *   Todos los documentos del usuario, leídos del servidor (falla sin conexión),
 *   para el respaldo JSON (backup.js).
 */

export {};
