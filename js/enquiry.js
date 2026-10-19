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

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable: list lives for this page only */ }
  listeners.forEach((fn) => fn(items));
}

export const enquiry = {
  all: () => items.map((i) => ({ ...i })),
  count: () => items.length,
  has: (slug) => items.some((i) => i.slug === slug),
  add(slug, qty = 1) { if (!this.has(slug)) { items.push({ slug, qty }); commit(); } },
  remove(slug) { items = items.filter((i) => i.slug !== slug); commit(); },
  toggle(slug) { this.has(slug) ? this.remove(slug) : this.add(slug); return this.has(slug); },
  setQty(slug, qty) { const i = items.find((x) => x.slug === slug); if (i && qty >= 1) { i.qty = Math.min(qty, 9999); commit(); } },
  clear() { items = []; commit(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

// Keep tabs in sync.
window.addEventListener('storage', (e) => { if (e.key === KEY) { items = read(); listeners.forEach((fn) => fn(items)); } });

/** Plain-text summary used for WhatsApp and the enquiry form. */
export function summary(list, inv) {
  return list.map((i) => { const it = inv.items.find((x) => x.slug === i.slug); return it ? `${it.name} × ${i.qty}` : null; }).filter(Boolean).join('\n');
}
