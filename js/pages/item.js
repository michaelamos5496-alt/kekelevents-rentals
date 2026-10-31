import { esc, picture, byCategory, reveal } from '../util.js';
import { enquiry, money, daysLabel, lineKey } from '../enquiry.js';
import { card, bindAdd } from './shared.js';

/** Product card markup (gallery + info) for one piece. Shared by the full item page and the product modal. */
export function buildCard(it, cat, dims) {
  const shots = [it.image, ...(it.gallery || []).filter((g) => g !== it.image)];
  return `
    <div class="pdp__gallery" data-reveal>
      <div class="media pdp__hero" ${it.placeholder ? 'data-placeholder' : ''}>${picture(shots[0], it.alt, dims[shots[0]], { eager: true, sizes: '(min-width: 55rem) 24vw, 70vw' })}</div>
      ${shots.length > 1 ? `<div class="pdp__thumbs">${shots.map((g, i) => `<button class="media pdp__thumb" type="button" data-shot="${g}" aria-label="${i === 0 ? 'Main view' : 'Detail view ' + i}" aria-current="${i === 0}">${picture(g, '', dims[g], { sizes: '5rem' })}</button>`).join('')}</div>` : ''}
    </div>
    <div class="pdp__info" data-reveal style="--d:80ms">
      <span class="pdp__crumb">${esc(cat.name)}</span>
      <h1 class="pdp__title">${esc(it.name)}</h1>
      <p class="pdp__desc">${esc(it.note)}</p>
      <div class="pdp__specs">
        <div class="pdp__spec"><span class="pdp__spec-k">Material</span><strong>${esc(it.material)}</strong></div>
        <div class="pdp__spec"><span class="pdp__spec-k">Dimensions</span><strong>${esc(it.dimensions)}</strong></div>
      </div>
      <p class="pdp__price">${it.price ? `${money(it.price)}<span>per day</span>` : 'Price on request'}</p>
      ${it.options ? `<fieldset class="swatches"><legend class="pdp__spec-k">${esc(it.options.label)}: <strong data-opt-name>choose one</strong></legend><div class="swatches__list">${it.options.choices.map((c) => `<button class="swatch" type="button" data-opt="${esc(c.name)}" aria-pressed="false" aria-label="${esc(c.name)}" title="${esc(c.name)}" style="--sw:${esc(c.hex)}"></button>`).join('')}</div></fieldset>` : ''}
      <div class="pdp__buy">
        <div class="qty qty--lg" role="group" aria-label="Quantity"><button type="button" data-q-dec aria-label="Decrease quantity">−</button><input class="qty__input" type="number" inputmode="numeric" pattern="[0-9]*" min="1" max="${it.quantity}" step="1" data-q-out aria-label="Quantity" value="1"><button type="button" data-q-inc aria-label="Increase quantity">+</button></div>
        <div class="pdp__actions">
          <button class="btn btn--solid" type="button" data-add-cart>Add to cart</button>
          <button class="btn" type="button" data-open-enquiry>View cart</button>
        </div>
      </div>
      <p class="pdp__total" data-q-total aria-live="polite"></p>
      <p class="pdp__fine">${it.quantity} to hire. Priced per day. Choose your start and return dates in the cart and the days are calculated for you. Items in your cart are not reserved until we confirm availability.</p>
      ${it.placeholder ? '<span class="ph-note">Placeholder details</span>' : ''}
    </div>`;
}

/** Wires up thumbnail swapping and the quantity/add-to-cart controls, scoped to `root` so the same markup works standalone or inside a modal. */
export function bindCard(root, it, dims) {
  const shots = [it.image, ...(it.gallery || []).filter((g) => g !== it.image)];

  // Switch the large photograph by rewriting the existing <picture> in place.
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-shot]'); if (!t) return;
    const id = t.dataset.shot, n = shots.indexOf(id), main = root.querySelector('.pdp__hero');
    const tmp = document.createElement('div');
    tmp.innerHTML = picture(id, n ? `${it.alt}, detail view ${n}` : it.alt, dims[id], { eager: true, sizes: '(min-width: 55rem) 24vw, 70vw' });
    const next = tmp.firstElementChild, cur = main.querySelector('picture');
    cur.replaceWith(next);
    root.querySelectorAll('.pdp__thumb').forEach((b) => b.setAttribute('aria-current', b === t));
  });

  // Quantity and add-to-cart: shows the current cart quantity if the piece is already in it.
  // A piece with options (e.g. tablecloth colours) needs one chosen first; each choice is its own cart line.
  const dec = root.querySelector('[data-q-dec]'), inc = root.querySelector('[data-q-inc]');
  const out = root.querySelector('[data-q-out]'), tot = root.querySelector('[data-q-total]'), addBtn = root.querySelector('[data-add-cart]');
  let opt = it.options ? enquiry.all().find((x) => x.slug === it.slug)?.option : undefined;
  const key = () => lineKey(it.slug, opt);
  let qty = enquiry.get(key())?.qty || 1;
  const paintBuy = () => {
    const inCart = (!it.options || opt) && enquiry.get(key());
    out.value = qty;
    dec.disabled = qty <= 1; inc.disabled = qty >= it.quantity;
    tot.textContent = it.price ? `${money(it.price * qty)} per day · ${money(it.price * qty * enquiry.days())} for ${daysLabel(enquiry.days())}` : 'Price on request';
    addBtn.disabled = Boolean(it.options && !opt);
    addBtn.textContent = addBtn.disabled ? `Choose a ${it.options.label.toLowerCase()}` : !inCart ? 'Add to cart' : inCart.qty === qty ? 'In your cart' : 'Update cart';
    if (it.options) {
      root.querySelector('[data-opt-name]').textContent = opt || 'choose one';
      root.querySelectorAll('[data-opt]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.opt === opt));
    }
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-opt]'); if (!b) return;
    opt = b.dataset.opt; qty = enquiry.get(key())?.qty || qty; paintBuy();
  });
  dec.addEventListener('click', () => { qty = Math.max(1, qty - 1); paintBuy(); });
  inc.addEventListener('click', () => { qty = Math.min(it.quantity, qty + 1); paintBuy(); });
  out.addEventListener('change', () => { const n = Math.round(Number(out.value)); qty = Number.isFinite(n) && n > 0 ? Math.min(it.quantity, n) : qty; paintBuy(); });
  out.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); out.blur(); } });
  addBtn.addEventListener('click', () => { enquiry.add(it.slug, qty, opt); paintBuy(); });
  const unsubBuy = enquiry.subscribe(paintBuy); paintBuy();
  const unsubAdd = bindAdd(root);
  return () => { unsubBuy(); unsubAdd(); };
}

export default function ({ inv, dims }) {
  const root = document.getElementById('item'), slug = new URLSearchParams(location.search).get('i');
  const it = inv.items.find((x) => x.slug === slug);
  if (!it) {
    document.title = 'Piece not found · Kekel Rentals';
    root.innerHTML = '<div class="wrap state" style="padding-top:12rem"><h1 class="lede">We could not find that piece.</h1><p>It may have been renamed or retired from the collection.</p><a class="btn" href="collections.html">Back to collections</a></div>';
    return;
  }
  const cat = byCategory(inv, it.category);
  document.title = `${it.name} · ${cat.name} · Kekel Rentals`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${it.name}: ${it.note}`);
  const pairs = inv.items.filter((x) => x.category !== it.category).map((x) => ({ x, s: x.mood.filter((m) => it.mood.includes(m)).length })).filter((p) => p.s).sort((a, b) => b.s - a.s).slice(0, 3).map((p) => p.x);

  root.innerHTML = `
    <div class="pdp">
      <div class="wrap">
        <div class="pdp__card">${buildCard(it, cat, dims)}</div>
      </div>
    </div>
    ${pairs.length ? `<div class="wrap"><section class="pairs section--tight" aria-labelledby="pairs-h"><span class="label">Pairs well with</span><h2 id="pairs-h">Complete the setting</h2><div class="catalogue" style="padding-block:0">${pairs.map((p, i) => card(p, byCategory(inv, p.category), dims, i * 80)).join('')}</div></section></div>` : ''}`;

  bindCard(root, it, dims);
  reveal(root);
}
