// Styling page: a few gallery photos (from data/gallery.json) and the service-area answer (from data/site.json).
import { picture, loadJSON, reveal } from '../util.js';
import { settleImages } from '../motion.js';

export default async function ({ site, dims }) {
  document.getElementById('faq-area').textContent = site.serviceArea;
  const { items } = await loadJSON('data/gallery.json');
  document.getElementById('recent').innerHTML = items.slice(0, 3).map((g, n) => `<article class="work work--small" data-reveal style="--d:${n * 90}ms">
      <a href="portfolio.html"><div class="media work__media">${picture(g.image, g.alt, dims[g.image], { sizes: '(min-width: 62rem) 30vw, 100vw' })}</div>
      <div class="work__meta"><span class="work__go" aria-hidden="true">View gallery →</span></div></a></article>`).join('');
  // Phone slide indicators: a dash per project, following the swipe position.
  const rail = document.getElementById('recent'), dots = document.getElementById('recent-dots'), n = Math.min(items.length, 3);
  dots.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" data-r="${i}" aria-label="Show project ${i + 1}" aria-current="${i === 0}"></button>`).join('');
  const at = () => Math.min(n - 1, Math.round(rail.scrollLeft / (rail.firstElementChild.getBoundingClientRect().width + 16)));
  rail.addEventListener('scroll', () => [...dots.children].forEach((d, i) => d.setAttribute('aria-current', i === at())), { passive: true });
  dots.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) rail.children[b.dataset.r].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }); });

  reveal(); settleImages('.work--small .work__media');
}
