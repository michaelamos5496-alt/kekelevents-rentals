// A single portfolio project: hero, story, gallery with lightbox, matching rentals, next/previous project.
import { esc, picture, loadJSON, byCategory, reveal } from '../util.js';
import { card, bindAdd } from './shared.js';
import { parallax, settleImages } from '../motion.js';

export default async function ({ inv, dims }) {
  const root = document.getElementById('project'), slug = new URLSearchParams(location.search).get('p');
  const { items } = await loadJSON('data/projects.json');
  const i = items.findIndex((x) => x.slug === slug), p = items[i];
  if (!p) {
    document.title = 'Project not found · Kekel Rentals';
    root.innerHTML = '<div class="wrap state" style="padding-top:12rem"><h1 class="lede">We could not find that project.</h1><p>It may have been moved or retired from the portfolio.</p><a class="btn" href="portfolio.html">Back to the portfolio</a></div>';
    return;
  }
  document.title = `${p.title} · Portfolio · Kekel Rentals`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${p.title}: ${p.summary}`);
  const prev = items[(i - 1 + items.length) % items.length], next = items[(i + 1) % items.length];
  const shots = [p.cover, ...p.gallery];
  const pieces = p.pieces.map((s) => inv.items.find((x) => x.slug === s)).filter(Boolean);

  root.innerHTML = `
    <div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="portfolio.html">Portfolio</a> / <span aria-current="page">${esc(p.title)}</span></nav>
      <header class="project-head"><span class="label">${esc(p.type)} · ${esc(p.location)}</span><h1 data-reveal>${esc(p.title)}</h1><p class="lede" data-reveal style="--d:100ms">${esc(p.summary)}</p></header></div>
    <figure class="project-hero media" data-reveal ${p.placeholder ? 'data-placeholder' : ''}>${picture(p.cover, p.alt, dims[p.cover], { eager: true, sizes: '100vw' })}</figure>
    <section class="wrap project-body">
      <dl class="project-facts" data-reveal><div><dt>Event</dt><dd>${esc(p.type)}</dd></div><div><dt>Location</dt><dd>${esc(p.location)}</dd></div><div><dt>Rentals featured</dt><dd>${pieces.length} pieces</dd></div></dl>
      <div class="project-story" data-reveal style="--d:100ms">${p.story.map((t) => `<p>${esc(t)}</p>`).join('')}${p.placeholder ? '<span class="ph-note">Placeholder project</span>' : ''}</div>
    </section>
    <section class="wrap project-gallery" aria-label="Photographs">
      ${shots.slice(1).map((g, n) => `<button class="media project-gallery__item" type="button" data-shot="${n + 1}" data-reveal style="--d:${n * 90}ms" aria-label="Enlarge photograph ${n + 2} of ${shots.length}" ${p.placeholder ? 'data-placeholder' : ''}>${picture(g, `${p.title}, photograph ${n + 2}`, dims[g], { sizes: '(min-width: 48rem) 33vw, 100vw' })}</button>`).join('')}
    </section>
    <section class="wrap pairs" aria-labelledby="r-h"><span class="label">From the rental collection</span><h2 id="r-h">Rentals that suit this setting</h2>
      <div class="catalogue" style="padding-block:0">${pieces.map((it, n) => card(it, byCategory(inv, it.category), dims, n * 80)).join('')}</div></section>
    <nav class="wrap project-nav" aria-label="More projects">
      <a href="project.html?p=${esc(prev.slug)}"><span class="label">Previous</span><strong>${esc(prev.title)}</strong></a>
      <a href="project.html?p=${esc(next.slug)}" class="project-nav__next"><span class="label">Next</span><strong>${esc(next.title)}</strong></a>
    </nav>
    <section class="section section--blue cta-band"><div class="wrap" data-reveal><span class="label">Enquire</span><h2>Planning something similar?</h2><div class="cta-band__actions"><a class="btn btn--solid" href="enquire.html">Begin your enquiry</a><a class="btn" href="collections.html">Browse rentals</a></div></div></section>`;

  // Lightbox: a glass dialog with arrows and keyboard support.
  const dlg = document.createElement('dialog'); dlg.className = 'lightbox'; dlg.setAttribute('aria-label', 'Photograph viewer');
  dlg.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close">×</button><button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous photograph">←</button><div class="lightbox__stage"></div><button class="lightbox__nav lightbox__next" type="button" aria-label="Next photograph">→</button>';
  document.body.append(dlg);
  let cur = 0, opener;
  const stage = dlg.querySelector('.lightbox__stage');
  const show = (n) => { cur = (n + shots.length) % shots.length; stage.innerHTML = picture(shots[cur], cur ? `${p.title}, photograph ${cur + 1}` : p.alt, dims[shots[cur]], { eager: true, sizes: '90vw' }); };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-shot]'); if (b) { opener = b; show(Number(b.dataset.shot)); dlg.showModal(); } });
  dlg.addEventListener('click', (e) => { if (e.target.closest('.lightbox__close') || e.target === dlg || e.target === stage) dlg.close(); if (e.target.closest('.lightbox__prev')) show(cur - 1); if (e.target.closest('.lightbox__next')) show(cur + 1); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
  dlg.addEventListener('close', () => opener?.focus());

  bindAdd(root); reveal(root); parallax('.project-hero', 5); settleImages('.project-gallery__item');
}
