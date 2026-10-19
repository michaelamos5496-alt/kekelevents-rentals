// The cart: a list of items (slug + quantity), persisted in localStorage.
// It holds no prices and no personal data, and is a request for a quote, not a reservation.
const KEY = 'kekel.enquiry.v1';
const listeners = new Set();

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((i) => i && typeof i.slug === 'string' && Number.isInteger(i.qty) && i.qty > 0) : [];
  } catch { return []; }
}
let items = read();
const DAYS_KEY = 'kekel.days.v1';
let days = (() => { try { const n = parseInt(localStorage.getItem(DAYS_KEY), 10); return n >= 1 && n <= 30 ? n : 1; } catch { return 1; } })();
let limits = {}; // slug -> units available, so a cart can never hold more than we own

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable: list lives for this page only */ }
  listeners.forEach((fn) => fn(items));
}

export const enquiry = {
  all: () => items.map((i) => ({ ...i })),
  count: () => items.length,
  has: (slug) => items.some((i) => i.slug === slug),
  setLimits(map) { limits = map; let changed = false; items.forEach((i) => { const m = limits[i.slug]; if (m && i.qty > m) { i.qty = m; changed = true; } }); if (changed) commit(); },
  max: (slug) => limits[slug] || 9999,
  add(slug, qty = 1) { qty = Math.max(1, Math.min(qty, limits[slug] || 9999)); const cur = items.find((x) => x.slug === slug); if (cur) cur.qty = qty; else items.push({ slug, qty }); commit(); },
  remove(slug) { items = items.filter((i) => i.slug !== slug); commit(); },
  toggle(slug) { this.has(slug) ? this.remove(slug) : this.add(slug); return this.has(slug); },
  setQty(slug, qty) { const i = items.find((x) => x.slug === slug); if (i && qty >= 1) { i.qty = Math.min(qty, limits[slug] || 9999); commit(); } },
  days: () => days,
  setDays(n) { days = Math.max(1, Math.min(30, Math.round(n) || 1)); try { localStorage.setItem(DAYS_KEY, String(days)); } catch { /* ignore */ } listeners.forEach((fn) => fn(items)); },
  clear() { items = []; commit(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

// Keep tabs in sync.
window.addEventListener('storage', (e) => { if (e.key === KEY) { items = read(); listeners.forEach((fn) => fn(items)); } });

export const money = (n) => `GH₵ ${Number(n).toLocaleString('en-GB')}`;

/** Priced lines plus the subtotal. Rates are per piece, per day; the subtotal covers every rental day. */
export function totals(list, inv, nDays = days) {
  const lines = list.map((i) => { const item = inv.items.find((x) => x.slug === i.slug); return item ? { item, qty: i.qty, unit: item.price || 0, perDay: (item.price || 0) * i.qty, line: (item.price || 0) * i.qty * nDays } : null; }).filter(Boolean);
  return { lines, days: nDays, perDay: lines.reduce((s, l) => s + l.perDay, 0), subtotal: lines.reduce((s, l) => s + l.line, 0), units: lines.reduce((s, l) => s + l.qty, 0) };
}
export const daysLabel = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;

/** Plain-text summary used for WhatsApp and the enquiry form. */
export function summary(list, inv) {
  const t = totals(list, inv);
  if (!t.lines.length) return '';
  return `${t.lines.map((l) => `${l.item.name} × ${l.qty} at ${money(l.unit)} per day`).join('\n')}\nRental period: ${daysLabel(t.days)}\nEstimated total: ${money(t.subtotal)} (delivery is confirmed in the quote)`;
}
