import { esc, picture, byCategory, reveal } from '../util.js';
import { enquiry } from '../enquiry.js';
import { card, bindAdd } from './shared.js';

export default function ({ inv, dims }) {
  const root = document.getElementById('item'), slug = new URLSearchParams(location.search).get('i');
  const it = inv.items.find((x) => x.slug === slug);
  if (!it) {
    document.title = 'Piece not found · Kekel Rentals';
    root.innerHTML = '<div class="wrap state" style="padding-top:12rem"><h1 class="lede">We could not find that piece.</h1><p>It may have been renamed or retired from the collection.</p><a class="btn" href="collections.html">Back to collections</a></div>';
    return;
  }
  const cat = byCategory(inv, it.category), shots = [it.image, ...(it.gallery || []).filter((g) => g !== it.image)];
  document.title = `${it.name} · ${cat.name} · Kekel Rentals`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${it.name}: ${it.note}`);
  const pairs = inv.items.filter((x) => x.category !== it.category).map((x) => ({ x, s: x.mood.filter((m) => it.mood.includes(m)).length })).filter((p) => p.s).sort((a, b) => b.s - a.s).slice(0, 3).map((p) => p.x);

  root.innerHTML = `
    <div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="collections.html">Rentals</a> / <a href="collections.html?c=${cat.id}">${esc(cat.name)}</a> / <span aria-current="page">${esc(it.name)}</span></nav>
    <div class="grid detail">
      <div class="detail__gallery" data-reveal>
        <div class="media gallery__main" id="main-shot" ${it.placeholder ? 'data-placeholder' : ''}>${picture(shots[0], it.alt, dims[shots[0]], { eager: true, sizes: '(min-width: 62rem) 58vw, 100vw' })}</div>
        ${shots.length > 1 ? `<div class="gallery__thumbs">${shots.map((g, i) => `<button class="media gallery__thumb" type="button" data-shot="${g}" aria-label="${i === 0 ? 'Main view' : 'Detail view ' + i}" aria-current="${i === 0}">${picture(g, '', dims[g], { sizes: '15vw' })}</button>`).join('')}</div>` : ''}
      </div>
      <div class="detail__info" data-reveal style="--d:120ms">
        <span class="label label--accent">${esc(cat.name)}</span>
        <h1>${esc(it.name)}</h1>
        <p class="detail__note">${esc(it.note)}</p>
        <dl class="specs"><div><dt>Material</dt><dd>${esc(it.material)}</dd></div><div><dt>Dimensions</dt><dd>${esc(it.dimensions)}</dd></div><div><dt>To hire</dt><dd>${it.quantity}</dd></div></dl>
        <div class="detail__actions"><button class="btn btn--solid" type="button" data-add="${esc(it.slug)}" data-long="1" aria-pressed="${enquiry.has(it.slug)}">${enquiry.has(it.slug) ? 'Added to cart' : 'Add to cart'}</button><button class="btn" type="button" data-open-enquiry>View cart</button></div>
        <p class="detail__note-small">Rental rates are shared on request. Items in your cart are not reserved until we confirm availability.</p>
        ${it.placeholder ? '<span class="ph-note">Placeholder details</span>' : ''}
      </div>
    </div>
    ${pairs.length ? `<section class="pairs section--tight" aria-labelledby="pairs-h"><span class="label">Pairs well with</span><h2 id="pairs-h">Complete the setting</h2><div class="catalogue" style="padding-block:0">${pairs.map((p, i) => card(p, byCategory(inv, p.category), dims, i * 80)).join('')}</div></section>` : ''}
    </div>`;

  // Switch the large photograph by rewriting the existing <picture> in place.
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-shot]'); if (!t) return;
    const id = t.dataset.shot, n = shots.indexOf(id), main = document.getElementById('main-shot');
    const tmp = document.createElement('div');
    tmp.innerHTML = picture(id, n ? `${it.alt}, detail view ${n}` : it.alt, dims[id], { eager: true, sizes: '(min-width: 62rem) 58vw, 100vw' });
    const next = tmp.firstElementChild, cur = main.querySelector('picture');
    cur.replaceWith(next);
    root.querySelectorAll('.gallery__thumb').forEach((b) => b.setAttribute('aria-current', b === t));
  });
  bindAdd(root); reveal(root);
}
