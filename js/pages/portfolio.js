// Portfolio index: filterable, asymmetric grid of project cards (data/projects.json).
import { esc, picture, loadJSON, reveal } from '../util.js';
import { settleImages } from '../motion.js';

export default async function ({ dims }) {
  const { categories, items } = await loadJSON('data/projects.json');
  const grid = document.getElementById('works'), filters = document.getElementById('p-filters'), count = document.getElementById('p-count');
  const params = new URLSearchParams(location.search);
  let current = categories.includes(params.get('c')) ? params.get('c') : 'All';

  filters.innerHTML = ['All', ...categories].map((c) => `<button class="filter" type="button" data-cat="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('');

  function render() {
    const list = items.filter((p) => current === 'All' || p.category === current);
    filters.querySelectorAll('.filter').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === current));
    count.textContent = `${list.length} ${list.length === 1 ? 'project' : 'projects'}`;
    grid.innerHTML = list.map((p, n) => `<article class="work" data-reveal style="--d:${(n % 2) * 90}ms">
        <a href="project.html?p=${esc(p.slug)}"><div class="media work__media" ${p.placeholder ? 'data-placeholder' : ''}>${picture(p.cover, p.alt, dims[p.cover], { sizes: '(min-width: 62rem) 55vw, 100vw' })}</div>
        <div class="work__meta"><div><h2>${esc(p.title)}</h2><span class="label">${esc(p.type)} · ${esc(p.location)}</span></div><span class="work__go" aria-hidden="true">View →</span></div></a>
      </article>`).join('');
    reveal(grid); settleImages('.work__media');
    const u = new URL(location); current === 'All' ? u.searchParams.delete('c') : u.searchParams.set('c', current); history.replaceState(null, '', u);
  }
  filters.addEventListener('click', (e) => { const b = e.target.closest('.filter'); if (b) { current = b.dataset.cat; render(); } });
  render();
}
