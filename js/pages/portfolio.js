// Portfolio: a simple photo gallery of real decor setups, with a lightbox. No categories, no per-project pages.
import { picture, loadJSON, reveal } from '../util.js';
import { settleImages } from '../motion.js';

export default async function ({ dims }) {
  const { items } = await loadJSON('data/gallery.json');
  const grid = document.getElementById('gallery');
  grid.innerHTML = items.map((g, n) => `<button class="media project-gallery__item" type="button" data-shot="${n}" data-reveal style="--d:${(n % 3) * 90}ms" aria-label="Enlarge photograph ${n + 1} of ${items.length}">${picture(g.image, g.alt, dims[g.image], { sizes: '(min-width: 48rem) 33vw, 100vw' })}</button>`).join('');

  // Lightbox: a glass dialog with arrows and keyboard support.
  const dlg = document.createElement('dialog'); dlg.className = 'lightbox'; dlg.setAttribute('aria-label', 'Photograph viewer');
  dlg.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close">×</button><button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous photograph">←</button><div class="lightbox__stage"></div><button class="lightbox__nav lightbox__next" type="button" aria-label="Next photograph">→</button>';
  document.body.append(dlg);
  let cur = 0, opener;
  const stage = dlg.querySelector('.lightbox__stage');
  const show = (n) => { cur = (n + items.length) % items.length; const g = items[cur]; stage.innerHTML = picture(g.image, g.alt, dims[g.image], { eager: true, sizes: '90vw' }); };
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-shot]'); if (b) { opener = b; show(Number(b.dataset.shot)); dlg.showModal(); } });
  dlg.addEventListener('click', (e) => { if (e.target.closest('.lightbox__close') || e.target === dlg || e.target === stage) dlg.close(); if (e.target.closest('.lightbox__prev')) show(cur - 1); if (e.target.closest('.lightbox__next')) show(cur + 1); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
  dlg.addEventListener('close', () => opener?.focus());

  reveal(grid); settleImages('.project-gallery__item');
}
