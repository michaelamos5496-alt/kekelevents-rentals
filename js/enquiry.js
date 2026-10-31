// The cart: a list of items (slug + quantity, plus the chosen option such as a colour), persisted in localStorage.
// It holds no prices and no personal data, and is a request for a quote, not a reservation.
const KEY = 'kekel.enquiry.v1';
const listeners = new Set();

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((i) => i && typeof i.slug === 'string' && Number.isInteger(i.qty) && i.qty > 0 && (i.option === undefined || typeof i.option === 'string')) : [];
  } catch { return []; }
}
let items = read();
// Rental dates (not personal data). The number of rental days is calculated from them: start and return day both count,
// so collecting on the same day is 1 day. With no dates chosen yet it is 1 day.
const DATES_KEY = 'kekel.dates.v1';
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const isISO = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
let dates = (() => { try { const v = JSON.parse(localStorage.getItem(DATES_KEY) || '{}'); return { start: isISO(v.start) ? v.start : '', end: isISO(v.end) ? v.end : '' }; } catch { return { start: '', end: '' }; } })();
const spanDays = (s, e2) => Math.round((Date.parse(e2) - Date.parse(s)) / 86400000) + 1;
let limits = {}; // slug -> units available, so a cart can never hold more than we own

/** One cart line per piece, or per piece and option (each colour of a tablecloth is its own line). */
export const lineKey = (slug, option) => (option ? `${slug}#${option}` : slug);
const keyOf = (i) => lineKey(i.slug, i.option);
const byKey = (key) => items.find((x) => keyOf(x) === key);

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable: list lives for this page only */ }
  listeners.forEach((fn) => fn(items));
}

export const enquiry = {
  all: () => items.map((i) => ({ ...i, key: keyOf(i) })),
  get: (key) => { const i = byKey(key); return i && { ...i, key }; },
  count: () => items.length,
  has: (slug) => items.some((i) => i.slug === slug),
  setLimits(map) {
    limits = map;
    let changed = false;
    const kept = items.filter((i) => { if (!(i.slug in map)) { changed = true; return false; } return true; }); // drop pieces no longer in the catalogue
    kept.forEach((i) => { const m = limits[i.slug]; if (m && i.qty > m) { i.qty = m; changed = true; } });
    items = kept;
    if (changed) commit();
  },
  max: (slug) => limits[slug] || 9999,
  add(slug, qty = 1, option) { qty = Math.max(1, Math.min(qty, limits[slug] || 9999)); const cur = byKey(lineKey(slug, option)); if (cur) cur.qty = qty; else items.push(option ? { slug, qty, option } : { slug, qty }); commit(); },
  remove(key) { items = items.filter((i) => keyOf(i) !== key); commit(); },
  toggle(slug) { this.has(slug) ? this.remove(slug) : this.add(slug); return this.has(slug); },
  setQty(key, qty) { const i = byKey(key); if (i && qty >= 1) { i.qty = Math.min(qty, limits[i.slug] || 9999); commit(); } },
  today: todayISO,
  dates: () => ({ ...dates }),
  days: () => (dates.start && dates.end ? Math.max(1, Math.min(90, spanDays(dates.start, dates.end))) : 1),
  hasDates: () => Boolean(dates.start && dates.end),
  setDates(start, end) {
    start = isISO(start) ? start : ''; end = isISO(end) ? end : '';
    if (start && start < todayISO()) start = todayISO();
    if (start && end && end < start) end = start; // the return day can't be before the start day
    dates = { start, end };
    try { localStorage.setItem(DATES_KEY, JSON.stringify(dates)); } catch { /* ignore */ }
    listeners.forEach((fn) => fn(items));
  },
  clear() { items = []; commit(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

// Keep tabs in sync.
window.addEventListener('storage', (e) => { if (e.key === KEY) { items = read(); listeners.forEach((fn) => fn(items)); } });

export const money = (n) => `GH₵ ${Number(n).toLocaleString('en-GB')}`;

/** Priced lines plus the subtotal. Rates are per piece, per day; the subtotal covers every rental day. */
export function totals(list, inv, nDays = enquiry.days()) {
  const lines = list.map((i) => { const item = inv.items.find((x) => x.slug === i.slug); return item ? { item, key: keyOf(i), option: i.option, qty: i.qty, unit: item.price || 0, perDay: (item.price || 0) * i.qty, line: (item.price || 0) * i.qty * nDays } : null; }).filter(Boolean);
  return { lines, days: nDays, perDay: lines.reduce((s, l) => s + l.perDay, 0), subtotal: lines.reduce((s, l) => s + l.line, 0), units: lines.reduce((s, l) => s + l.qty, 0) };
}
export const daysLabel = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
export const fmtDate = (s) => (s ? new Date(`${s}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const periodLabel = () => { const d = enquiry.dates(); return d.start && d.end ? `${fmtDate(d.start)} to ${fmtDate(d.end)} (${daysLabel(enquiry.days())})` : `${daysLabel(1)} (dates not chosen yet)`; };

/** Plain-text summary used for WhatsApp and the enquiry form. */
export function summary(list, inv) {
  const t = totals(list, inv);
  if (!t.lines.length) return '';
  return `${t.lines.map((l) => `${l.item.name}${l.option ? ` (${l.option})` : ''} × ${l.qty} at ${money(l.unit)} per day`).join('\n')}\nRental period: ${periodLabel()}\nEstimated total: ${money(t.subtotal)} (delivery is confirmed in the quote)`;
}
