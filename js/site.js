// Entry point for every page: builds the chrome, then runs the page's own module (data-page on <body>).
import { initLayout } from './layout.js';
import { reveal } from './util.js';

try {
  const ctx = await initLayout();
  const page = document.body.dataset.page;
  if (page) { const mod = await import(`./pages/${page}.js`); await mod.default(ctx); }
  reveal();
} catch (err) {
  console.error(err);
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in')); // never leave content hidden
}
