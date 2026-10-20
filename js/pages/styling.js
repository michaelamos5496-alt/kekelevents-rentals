// Styling page: recent projects (from data/projects.json) and the service-area answer (from data/site.json).
import { esc, picture, loadJSON, reveal } from '../util.js';
import { settleImages } from '../motion.js';

export default async function ({ site, dims }) {
  document.getElementById('faq-area').textContent = site.serviceArea;
  const { items } = await loadJSON('data/projects.json');
  document.getElementById('recent').innerHTML = items.slice(0, 3).map((p, n) => `<article class="work work--small" data-reveal style="--d:${n * 90}ms">
      <a href="project.html?p=${esc(p.slug)}"><div class="media work__media" ${p.placeholder ? 'data-placeholder' : ''}>${picture(p.cover, p.alt, dims[p.cover], { sizes: '(min-width: 62rem) 30vw, 100vw' })}</div>
      <div class="work__meta"><div><h3>${esc(p.title)}</h3><span class="label">${esc(p.type)}</span></div><span class="work__go" aria-hidden="true">View →</span></div></a></article>`).join('');
  reveal(); settleImages('.work--small .work__media');
}
