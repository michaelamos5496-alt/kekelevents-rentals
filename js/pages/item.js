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

  // Numbered side rail: this piece's position among the rest of its category, with wrap-around prev/next.
  const siblings = inv.items.filter((x) => x.category === it.category);
  const idx = siblings.findIndex((x) => x.slug === it.slug), total = siblings.length;
  const prevSlug = siblings[(idx - 1 + total) % total]?.slug, nextSlug = siblings[(idx + 1) % total]?.slug;
  const pad2 = (n) => String(n).padStart(2, '0');
  const [dotA, dotB] = it.category === 'tablescape' ? ['Surface', 'Base'] : ['Finish', 'Seat'];

  root.innerHTML = `
    <div class="pdp">
      <div class="pdp__hero-row">
        <div class="pdp__crop" aria-hidden="true">
          ${picture(shots[0], '', dims[shots[0]], { eager: true, sizes: '19vw' })}
          <span class="pdp__dot" style="top:32%;left:56%"><span class="pdp__dot-ring"></span>${esc(dotA)}</span>
          <span class="pdp__dot" style="top:70%;left:24%"><span class="pdp__dot-ring"></span>${esc(dotB)}</span>
        </div>
        <div class="wrap pdp__hero-wrap">
          <div class="pdp__shots" data-reveal>
            <figure class="media pdp__shot">${picture(shots[0], it.alt, dims[shots[0]], { eager: true, sizes: '(min-width: 48rem) 24vw, 45vw' })}</figure>
            ${shots[1] ? `<figure class="media pdp__shot pdp__shot--alt">${picture(shots[1], `${it.alt}, detail view`, dims[shots[1]], { sizes: '(min-width: 48rem) 24vw, 45vw' })}</figure>` : ''}
          </div>
          <nav class="pdp__rail" aria-label="Browse ${esc(cat.name)}">
            <span class="pdp__rail-count">${pad2(idx + 1)} / ${pad2(total)}</span>
            <div class="pdp__rail-nav">
              <a class="pdp__navbtn" href="item.html?i=${esc(prevSlug)}" aria-label="Previous in ${esc(cat.name)}" ${total < 2 ? 'aria-disabled="true" tabindex="-1"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></a>
              <a class="pdp__navbtn" href="item.html?i=${esc(nextSlug)}" aria-label="Next in ${esc(cat.name)}" ${total < 2 ? 'aria-disabled="true" tabindex="-1"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>
            </div>
            <div class="pdp__bar"><span style="--p:${Math.round(((idx + 1) / total) * 100)}%"></span></div>
          </nav>
        </div>
      </div>
      <div class="wrap pdp__info-row">
        <div class="pdp__info-main" data-reveal>
          <span class="pdp__crumb">Rentals / ${esc(cat.name)}</span>
          <h1 class="pdp__title">${esc(it.name)}</h1>
          <p class="pdp__price">${money(it.price)}<span>per day</span></p>
          <div class="pdp__buy">
            <span class="pdp__qty-label" id="qty-l">Quantity</span>
            <div class="qty qty--lg" role="group" aria-labelledby="qty-l"><button type="button" id="q-dec" aria-label="Decrease quantity">−</button><output id="q-out" aria-live="polite">1</output><button type="button" id="q-inc" aria-label="Increase quantity">+</button></div>
            <div class="pdp__actions">
              <button class="btn btn--solid" type="button" id="add-cart">Add to cart</button>
              <button class="icon-btn" type="button" data-open-enquiry aria-label="View cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg></button>
            </div>
          </div>
          <p class="pdp__total" id="q-total" aria-live="polite"></p>
        </div>
        <div class="pdp__info-side" data-reveal style="--d:80ms">
          <div class="pdp__credit"><div><span class="pdp__credit-k">Material</span><span>${esc(it.material)}</span></div><div><span class="pdp__credit-k">Dimensions</span><span>${esc(it.dimensions)}</span></div></div>
          <p class="pdp__desc">${esc(it.note)}</p>
          <p class="pdp__fine">${it.quantity} to hire. Priced per day. Choose your start and return dates in the cart and the days are calculated for you. Items in your cart are not reserved until we confirm availability.</p>
          ${it.placeholder ? '<span class="ph-note">Placeholder details</span>' : ''}
        </div>
      </div>
      <div class="wrap pdp__social-row"><a class="pdp__social" href="https://instagram.com/kekelrentals" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.9"/></svg></a></div>
    </div>
    ${pairs.length ? `<div class="wrap"><section class="pairs section--tight" aria-labelledby="pairs-h"><span class="label">Pairs well with</span><h2 id="pairs-h">Complete the setting</h2><div class="catalogue" style="padding-block:0">${pairs.map((p, i) => card(p, byCategory(inv, p.category), dims, i * 80)).join('')}</div></section></div>` : ''}`;
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
