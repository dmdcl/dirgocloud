// Fechas de la app, sin DOM ni Firebase. "Hoy" es siempre el de la Ciudad de
// México, no el de la zona del dispositivo ni UTC: un movimiento no cambia de
// día según dónde esté el teléfono. Fechas 'YYYY-MM-DD' y meses 'YYYY-MM' son
// texto y se comparan como cadenas.

export const TIME_ZONE = 'America/Mexico_City';

const mxParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23', // 00-23: con hour12: false algunos motores dan '24' a medianoche.
});

function partsMX(now) {
  return Object.fromEntries(mxParts.formatToParts(now).map(({ type, value }) => [type, value]));
}

/** Fecha 'YYYY-MM-DD' en la Ciudad de México en el instante `now`. */
export function todayMX(now = new Date()) {
  const p = partsMX(now);
  return `${p.year}-${p.month}-${p.day}`;
}

/** 'YYYY-MM-DD-HHmm' en la Ciudad de México, para nombres de archivo. */
export function timestampMX(now = new Date()) {
  const p = partsMX(now);
  return `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}`;
}

/** Mes 'YYYY-MM' desplazado `delta` meses: shiftMonth('2026-12', 1) === '2027-01'. */
export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}
