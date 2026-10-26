import { esc, picture, byCategory, reveal } from '../util.js';
import { enquiry, money, daysLabel } from '../enquiry.js';
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
    <div class="pdp">
      <div class="wrap">
        <div class="pdp__card">
          <div class="pdp__gallery" data-reveal>
            <div class="media pdp__hero" id="main-shot" ${it.placeholder ? 'data-placeholder' : ''}>${picture(shots[0], it.alt, dims[shots[0]], { eager: true, sizes: '(min-width: 55rem) 24vw, 70vw' })}</div>
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
            <p class="pdp__price">${money(it.price)}<span>per day</span></p>
            <div class="pdp__buy">
              <div class="qty qty--lg" role="group" aria-label="Quantity"><button type="button" id="q-dec" aria-label="Decrease quantity">−</button><output id="q-out" aria-live="polite">1</output><button type="button" id="q-inc" aria-label="Increase quantity">+</button></div>
              <div class="pdp__actions">
                <button class="btn btn--solid" type="button" id="add-cart">Add to cart</button>
                <button class="btn" type="button" data-open-enquiry>View cart</button>
              </div>
            </div>
            <p class="pdp__total" id="q-total" aria-live="polite"></p>
            <p class="pdp__fine">${it.quantity} to hire. Priced per day. Choose your start and return dates in the cart and the days are calculated for you. Items in your cart are not reserved until we confirm availability.</p>
            ${it.placeholder ? '<span class="ph-note">Placeholder details</span>' : ''}
          </div>
        </div>
      </div>
    </div>
    ${pairs.length ? `<div class="wrap"><section class="pairs section--tight" aria-labelledby="pairs-h"><span class="label">Pairs well with</span><h2 id="pairs-h">Complete the setting</h2><div class="catalogue" style="padding-block:0">${pairs.map((p, i) => card(p, byCategory(inv, p.category), dims, i * 80)).join('')}</div></section></div>` : ''}`;

  // Switch the large photograph by rewriting the existing <picture> in place.
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-shot]'); if (!t) return;
    const id = t.dataset.shot, n = shots.indexOf(id), main = document.getElementById('main-shot');
    const tmp = document.createElement('div');
    tmp.innerHTML = picture(id, n ? `${it.alt}, detail view ${n}` : it.alt, dims[id], { eager: true, sizes: '(min-width: 55rem) 24vw, 70vw' });
    const next = tmp.firstElementChild, cur = main.querySelector('picture');
    cur.replaceWith(next);
    root.querySelectorAll('.pdp__thumb').forEach((b) => b.setAttribute('aria-current', b === t));
  });
  // Quantity and add-to-cart: shows the current cart quantity if the piece is already in it.
  const out = document.getElementById('q-out'), tot = document.getElementById('q-total'), addBtn = document.getElementById('add-cart');
  let qty = enquiry.all().find((x) => x.slug === it.slug)?.qty || 1;
  const paintBuy = () => {
    const inCart = enquiry.all().find((x) => x.slug === it.slug);
    out.textContent = qty;
    document.getElementById('q-dec').disabled = qty <= 1; document.getElementById('q-inc').disabled = qty >= it.quantity;
    tot.textContent = `${money(it.price * qty)} per day · ${money(it.price * qty * enquiry.days())} for ${daysLabel(enquiry.days())}`;
    addBtn.textContent = !inCart ? 'Add to cart' : inCart.qty === qty ? 'In your cart' : 'Update cart';
  };
  document.getElementById('q-dec').addEventListener('click', () => { qty = Math.max(1, qty - 1); paintBuy(); });
  document.getElementById('q-inc').addEventListener('click', () => { qty = Math.min(it.quantity, qty + 1); paintBuy(); });
  addBtn.addEventListener('click', () => { enquiry.add(it.slug, qty); paintBuy(); });
  enquiry.subscribe(paintBuy); paintBuy();
  bindAdd(root); reveal(root);
}
