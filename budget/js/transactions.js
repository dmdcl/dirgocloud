// Movimientos del mes: lista, totales y formulario para agregar / editar / borrar.
// Solo habla con un Repository (repository.js), nunca con Firestore directo.

const $ = (id) => document.getElementById(id);
const monthLabel = $('month-label');
const form = $('tx-form');
const formTitle = $('tx-form-title');
const submitBtn = $('tx-submit');
const cancelBtn = $('tx-cancel');
const errorEl = $('tx-error');
const emptyEl = $('tx-empty');
const list = $('tx-list');
const totals = { income: $('total-income'), expense: $('total-expense'), net: $('total-net') };

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });
const MAX_CENTS = 100000000000; // Mismo límite que firestore.rules.

/** @type {import('./repository.js').Repository | null} */
let repo = null;
let editingId = null;
let month = ''; // Mes visible, 'YYYY-MM'.
let loadSeq = 0; // Descarta respuestas de meses que ya no se ven.

/** @param {import('./repository.js').Repository} repository */
export function startTransactions(repository) {
  repo = repository;
  setMonth(today().slice(0, 7));
  resetForm();
  load();
}

export function stopTransactions() {
  repo = null;
  loadSeq++;
  list.replaceChildren();
  resetForm();
  showError('');
}

// Fecha local 'YYYY-MM-DD' (toISOString usaría UTC).
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Etiqueta en español sin depender del idioma del navegador: 'Noviembre de 2026'.
function setMonth(value) {
  month = value;
  const [y, m] = value.split('-').map(Number);
  const label = monthName.format(new Date(y, m - 1, 1));
  monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  monthLabel.dataset.month = value;
}

function shiftMonth(value, delta) {
  const [y, m] = value.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// '1,234.5' -> 123450 centavos; null si no es un monto válido.
function parseCents(text) {
  const m = text.trim().replace(/,/g, '').match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const cents = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function resetForm() {
  editingId = null;
  form.reset();
  form.elements.date.value = !month || today().startsWith(month) ? today() : `${month}-01`;
  formTitle.textContent = 'NUEVO MOVIMIENTO';
  submitBtn.textContent = 'AGREGAR';
  cancelBtn.hidden = true;
}

async function load() {
  if (!repo || !month) return;
  const seq = ++loadSeq;
  try {
    const items = await repo.listTransactions(month);
    if (seq === loadSeq) render(items);
  } catch (err) {
    console.error(err);
    if (seq === loadSeq) showError('No se pudieron cargar los movimientos.');
  }
}

function render(items) {
  let income = 0;
  let expense = 0;
  list.replaceChildren(...items.map((tx) => {
    if (tx.type === 'income') income += tx.amount; else expense += tx.amount;

    const li = document.createElement('li');
    li.className = 'tx__item';
    const date = document.createElement('span');
    date.className = 'tx__date';
    date.textContent = tx.date;
    const desc = document.createElement('span');
    desc.className = 'tx__desc';
    desc.textContent = tx.description || (tx.type === 'income' ? 'Ingreso' : 'Gasto');
    const amount = document.createElement('span');
    amount.className = `tx__amount tx__amount--${tx.type}`;
    amount.textContent = `${tx.type === 'income' ? '+' : '−'}${money.format(tx.amount / 100)}`;
    const edit = button('EDITAR', () => startEdit(tx));
    const del = button('BORRAR', () => remove(tx));
    li.append(date, desc, amount, edit, del);
    return li;
  }));
  totals.income.textContent = money.format(income / 100);
  totals.expense.textContent = money.format(expense / 100);
  totals.net.textContent = money.format((income - expense) / 100);
  emptyEl.hidden = items.length > 0;
}

function button(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tx__link';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function startEdit(tx) {
  editingId = tx.id;
  form.elements.date.value = tx.date;
  form.elements.type.value = tx.type;
  form.elements.amount.value = (tx.amount / 100).toFixed(2);
  form.elements.description.value = tx.description;
  formTitle.textContent = 'EDITAR MOVIMIENTO';
  submitBtn.textContent = 'GUARDAR';
  cancelBtn.hidden = false;
  showError('');
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function remove(tx) {
  if (!repo || !confirm(`¿Borrar el movimiento del ${tx.date} por ${money.format(tx.amount / 100)}?`)) return;
  showError('');
  try {
    await repo.deleteTransaction(tx.id);
    if (editingId === tx.id) resetForm();
    await load();
  } catch (err) {
    console.error(err);
    showError('No se pudo borrar el movimiento.');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!repo) return;
  const f = form.elements;
  const amount = parseCents(f.amount.value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date.value)) return showError('Elige una fecha.');
  if (amount === null) return showError('Escribe un monto mayor a 0, con hasta 2 decimales.');

  const data = {
    date: f.date.value,
    type: f.type.value,
    amount,
    categoryId: null, // Categorías: módulo 4.
    description: f.description.value.trim().slice(0, 200),
  };
  showError('');
  submitBtn.disabled = true;
  try {
    if (editingId) await repo.updateTransaction(editingId, data);
    else await repo.addTransaction(data);
    setMonth(data.date.slice(0, 7)); // Muestra el mes del movimiento guardado.
    resetForm();
    await load();
  } catch (err) {
    console.error(err);
    showError('No se pudo guardar el movimiento.');
  } finally {
    submitBtn.disabled = false;
  }
});

cancelBtn.addEventListener('click', () => { resetForm(); showError(''); });

function changeMonth(value) {
  setMonth(value);
  if (!editingId) resetForm();
  showError('');
  load();
}

$('month-prev').addEventListener('click', () => changeMonth(shiftMonth(month, -1)));
$('month-next').addEventListener('click', () => changeMonth(shiftMonth(month, 1)));
