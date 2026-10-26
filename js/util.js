import { reveal as gsapReveal } from './motion.js';
// Shared helpers: data loading, escaping, responsive <picture> markup, reveal-on-scroll.
const cache = new Map();

/** Fetch a JSON file once and reuse it across modules. */
export function loadJSON(path) {
  if (!cache.has(path)) cache.set(path, fetch(path).then((r) => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); }));
  return cache.get(path);
}
export const loadSite = () => loadJSON('data/site.json');
export const loadInventory = () => loadJSON('data/inventory.json');
export const loadSetups = () => loadJSON('data/setups.json');
export const loadImages = () => loadJSON('data/images.json');

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Responsive image. `id` is a file stem in assets/images (WebP at 480/960/1600 with a JPEG fallback).
 * `dims` is the image's {w,h} from data/images.json, used for intrinsic size so layout never shifts.
 */
export function picture(id, alt, dims, { sizes = '100vw', eager = false, cls = '' } = {}) {
  const w = dims?.w || 1600, h = dims?.h || 1067;
  const widths = [480, 960, 1600].filter((x) => x === 480 || x <= w);
  const srcset = widths.map((x) => `assets/images/${id}-${x}.webp ${x}w`).join(', ');
  // No WebP variant has been generated for this image yet; serve the JPEG fallback directly.
  const webpSource = dims?.jpgOnly ? '' : `<source type="image/webp" srcset="${srcset}" sizes="${sizes}">`;
  return `<picture>${webpSource}<img class="${cls}" src="assets/images/${id}-960.jpg" width="${w}" height="${h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}

let observer;
/** Fade-and-rise on scroll. Safe to call repeatedly for newly rendered content. */
export function reveal(root = document) {
  if (gsapReveal(root)) return; // GSAP handles it; otherwise fall back to IntersectionObserver below
  const els = root.querySelectorAll('[data-reveal]:not(.is-in)');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  observer ??= new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); observer.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e) => observer.observe(e));
}

export const byCategory = (inv, id) => inv.categories.find((c) => c.id === id);
/** Categories that currently have at least one piece; empty ones stay hidden until stock is added. */
export const stocked = (inv) => inv.categories.filter((c) => inv.items.some((i) => i.category === c.id));
