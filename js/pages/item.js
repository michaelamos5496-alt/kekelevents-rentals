import { esc, picture, byCategory, reveal, optionImage, setPageMeta } from '../util.js';
import { enquiry, money, daysLabel, lineKey } from '../enquiry.js';
import { card, bindAdd } from './shared.js';

/** Product card markup (gallery + info) for one piece. Shared by the full item page and the product modal. */
export function buildCard(it, cat, dims) {
  const shots = [it.image, ...(it.gallery || []).filter((g) => g !== it.image)];
  const uid = `pdp-${it.slug}`;
  const tabs = [
    ['Description', `<p>${esc(it.note)}</p>`],
    ['Details', `<dl class="pdp__dl"><dt>Category</dt><dd>${esc(cat.name)}</dd><dt>Material</dt><dd>${esc(it.material)}</dd><dt>Dimensions</dt><dd>${esc(it.dimensions)}</dd>${it.options ? `<dt>${esc(it.options.label)}s</dt><dd>${it.options.choices.map((c) => esc(c.name)).join(', ')}</dd>` : ''}<dt>Available</dt><dd>${it.quantity} to hire</dd></dl>`],
    ['Hire terms', '<p>Priced per piece, per day. Choose your start and return dates in the cart and the days are calculated for you.</p><p>Items in your cart are not reserved until we confirm availability. Delivery, setup and collection are quoted separately.</p>'],
  ];
  return `
    <div class="pdp__gallery" data-reveal>
      <div class="pdp__frame"><div class="media pdp__hero" ${it.placeholder ? 'data-placeholder' : ''}>${picture(shots[0], it.alt, dims[shots[0]], { eager: true, sizes: '(min-width: 55rem) 30vw, 80vw' })}</div></div>
      ${shots.length > 1 ? `<div class="pdp__thumbs">${shots.map((g, i) => `<button class="media pdp__thumb" type="button" data-shot="${g}" aria-label="${i === 0 ? 'Main view' : 'Detail view ' + i}" aria-current="${i === 0}">${picture(g, '', dims[g], { sizes: '5rem' })}</button>`).join('')}</div>` : ''}
    </div>
    <div class="pdp__info" data-reveal style="--d:80ms">
      <div class="pdp__head">
        <h1 class="pdp__title">${esc(it.name)}</h1>
        <span class="pdp__badge">${esc(cat.name)}</span>
      </div>
      <p class="pdp__meta"><span>${esc(it.material)}</span><span>Size: ${esc(it.dimensions)}</span></p>
      <p class="pdp__price">${it.price ? `${money(it.price)}<span>per piece, per day</span>` : 'Price on request'}</p>
      <p class="pdp__stock"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="m4 8.5 8 4.5 8-4.5M12 13v7"/></svg>${it.quantity} available to hire</p>
      ${it.options ? `<fieldset class="swatches"><legend class="pdp__label">${esc(it.options.label)}s: <strong data-opt-name>choose one or more</strong></legend><div class="swatches__list">${it.options.choices.map((c) => `<button class="swatch" type="button" data-opt="${esc(c.name)}" aria-pressed="false" aria-label="${esc(c.name)}" title="${esc(c.name)}" style="--sw:${esc(c.hex)}"></button>`).join('')}</div></fieldset>
      <div class="picks" data-picks></div>
      <p class="pdp__total" data-q-total aria-live="polite"></p>` : `
      <span class="pdp__label">Quantity</span>
      <div class="pdp__buy">
        <div class="qty qty--lg" role="group" aria-label="Quantity"><button type="button" data-q-dec aria-label="Decrease quantity">−</button><input class="qty__input" type="number" inputmode="numeric" pattern="[0-9]*" min="1" max="${it.quantity}" step="1" data-q-out aria-label="Quantity" value="1"><button type="button" data-q-inc aria-label="Increase quantity">+</button></div>
        <p class="pdp__total" data-q-total aria-live="polite"></p>
      </div>`}
      <div class="pdp__actions">
        <button class="btn btn--solid" type="button" data-add-cart>Add to cart</button>
        <button class="btn" type="button" data-open-enquiry>View cart<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg></button>
      </div>
      <div class="pdp__tabs" role="tablist" aria-label="About this piece">${tabs.map(([t], i) => `<button type="button" role="tab" id="${uid}-t${i}" aria-controls="${uid}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t}</button>`).join('')}</div>
      ${tabs.map(([, body], i) => `<div class="pdp__panel" role="tabpanel" id="${uid}-p${i}" aria-labelledby="${uid}-t${i}"${i ? ' hidden' : ''}>${body}</div>`).join('')}
      ${it.placeholder ? '<span class="ph-note">Placeholder details</span>' : ''}
    </div>`;
}

/** Wires up thumbnail swapping and the quantity/add-to-cart controls, scoped to `root` so the same markup works standalone or inside a modal. */
export function bindCard(root, it, dims) {
  const shots = [it.image, ...(it.gallery || []).filter((g) => g !== it.image)];

  // Switch the large photograph by rewriting the existing <picture> in place.
  const main = root.querySelector('.pdp__hero');
  let shown = shots[0];
  const show = (id, alt) => {
    if (id === shown) return;
    shown = id;
    const tmp = document.createElement('div');
    tmp.innerHTML = picture(id, alt, dims[id], { eager: true, sizes: '(min-width: 55rem) 24vw, 70vw' });
    main.querySelector('picture').replaceWith(tmp.firstElementChild);
    root.querySelectorAll('.pdp__thumb').forEach((b) => b.setAttribute('aria-current', b.dataset.shot === id));
  };
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-shot]'); if (!t) return;
    const id = t.dataset.shot, n = shots.indexOf(id);
    show(id, n ? `${it.alt}, detail view ${n}` : it.alt);
  });
  // A chosen option with its own photograph (e.g. a tablecloth colour) takes over the large view.
  // A colour without one goes back to the main photograph rather than leaving another colour on screen.
  const showOption = (o) => { const id = optionImage(it, o); show(id, id === it.image ? it.alt : `${it.name} in ${o}`); };

  // Description / Details / Hire terms tabs, with arrow-key movement between them.
  const tabBtns = [...root.querySelectorAll('[role="tab"]')];
  const selectTab = (t) => tabBtns.forEach((b) => {
    const on = b === t;
    b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
    root.querySelector(`#${b.getAttribute('aria-controls')}`).hidden = !on;
  });
  root.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) selectTab(t); });
  root.addEventListener('keydown', (e) => {
    const i = tabBtns.indexOf(e.target); if (i < 0 || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const t = tabBtns[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabBtns.length) % tabBtns.length]; selectTab(t); t.focus();
  });

  const tot = root.querySelector('[data-q-total]'), addBtn = root.querySelector('[data-add-cart]');
  const totalLine = (n) => (it.price ? `${money(it.price * n)} per day · ${money(it.price * n * enquiry.days())} for ${daysLabel(enquiry.days())}` : 'Price on request');
  const paintBuy = it.options ? bindPicks(root, it, { tot, addBtn, totalLine, showOption }) : bindQty(root, it, { tot, addBtn, totalLine });
  const unsubBuy = enquiry.subscribe(paintBuy);
  const unsubAdd = bindAdd(root);
  return () => { unsubBuy(); unsubAdd(); };
}

/** A single quantity for a piece without options. Shows the current cart quantity if the piece is already in it. */
function bindQty(root, it, { tot, addBtn, totalLine }) {
  const dec = root.querySelector('[data-q-dec]'), inc = root.querySelector('[data-q-inc]'), out = root.querySelector('[data-q-out]');
  let qty = enquiry.get(it.slug)?.qty || 1;
  const paint = () => {
    const inCart = enquiry.get(it.slug);
    out.value = qty;
    dec.disabled = qty <= 1; inc.disabled = qty >= it.quantity;
    tot.textContent = totalLine(qty);
    addBtn.textContent = !inCart ? 'Add to cart' : inCart.qty === qty ? 'In your cart' : 'Update cart';
  };
  dec.addEventListener('click', () => { qty = Math.max(1, qty - 1); paint(); });
  inc.addEventListener('click', () => { qty = Math.min(it.quantity, qty + 1); paint(); });
  out.addEventListener('change', () => { const n = Math.round(Number(out.value)); qty = Number.isFinite(n) && n > 0 ? Math.min(it.quantity, n) : qty; paint(); });
  out.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); out.blur(); } });
  addBtn.addEventListener('click', () => enquiry.add(it.slug, qty));
  paint();
  return paint;
}

/**
 * Several options at once (e.g. 10 red and 10 ivory tablecloths): each swatch toggles a colour on or off, each chosen
 * colour gets its own quantity, and one button adds them all. Each colour is still its own cart line.
 * The quantities together never exceed the number of pieces available.
 */
function bindPicks(root, it, { tot, addBtn, totalLine, showOption }) {
  const list = root.querySelector('[data-picks]'), label = root.querySelector('[data-opt-name]');
  const hex = Object.fromEntries(it.options.choices.map((c) => [c.name, c.hex]));
  // Start from whatever colours of this piece are already in the cart.
  const picks = new Map(enquiry.all().filter((x) => x.slug === it.slug && x.option in hex).map((x) => [x.option, x.qty]));
  const total = () => [...picks.values()].reduce((s, n) => s + n, 0);
  const room = (name) => it.quantity - total() + (picks.get(name) || 0); // most this colour can take
  let rowsFor = '';

  const paint = () => {
    const names = [...picks.keys()];
    if (names.join('|') !== rowsFor) { // rebuild rows only when the set of colours changes, so focus stays put while adjusting
      rowsFor = names.join('|');
      list.innerHTML = names.map((n) => `<div class="pick" data-pick="${esc(n)}"><span class="pick__dot" style="--sw:${esc(hex[n])}"></span><span class="pick__name">${esc(n)}</span><div class="qty" role="group" aria-label="Quantity of ${esc(n)}"><button type="button" data-pick-dec aria-label="Fewer ${esc(n)}">−</button><input class="qty__input" type="number" inputmode="numeric" pattern="[0-9]*" min="1" step="1" data-pick-qty aria-label="Quantity of ${esc(n)}"><button type="button" data-pick-inc aria-label="More ${esc(n)}">+</button></div><button class="pick__remove" type="button" data-pick-remove aria-label="Remove ${esc(n)}">×</button></div>`).join('');
    }
    list.querySelectorAll('[data-pick]').forEach((row) => {
      const n = row.dataset.pick, q = picks.get(n);
      const input = row.querySelector('[data-pick-qty]'); input.value = q; input.max = room(n);
      row.querySelector('[data-pick-dec]').disabled = q <= 1;
      row.querySelector('[data-pick-inc]').disabled = q >= room(n);
    });
    root.querySelectorAll('[data-opt]').forEach((b) => b.setAttribute('aria-pressed', picks.has(b.dataset.opt)));
    label.textContent = names.length ? names.join(', ') : 'choose one or more';
    const sum = total();
    tot.textContent = sum ? `${sum} ${sum === 1 ? 'piece' : 'pieces'} · ${totalLine(sum)}` : '';
    const inCart = names.filter((n) => enquiry.get(lineKey(it.slug, n))?.qty === picks.get(n)).length;
    addBtn.disabled = !names.length;
    addBtn.textContent = !names.length ? `Choose a ${it.options.label.toLowerCase()}`
      : inCart === names.length ? 'In your cart'
        : names.some((n) => enquiry.get(lineKey(it.slug, n))) ? 'Update cart'
          : names.length === 1 ? 'Add to cart' : `Add ${names.length} ${it.options.label.toLowerCase()}s to cart`;
  };

  const setQty = (n, q) => { picks.set(n, Math.max(1, Math.min(room(n), q))); paint(); };
  root.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-opt]');
    if (sw) {
      const n = sw.dataset.opt;
      if (picks.has(n)) { picks.delete(n); const last = [...picks.keys()].pop(); showOption(last); } // back to another chosen colour, or the main photo
      else if (room(n) >= 1) { picks.set(n, 1); showOption(n); }
      paint(); return;
    }
    const row = e.target.closest('[data-pick]'); if (!row) return;
    const n = row.dataset.pick;
    if (e.target.closest('[data-pick-dec]')) setQty(n, picks.get(n) - 1);
    else if (e.target.closest('[data-pick-inc]')) setQty(n, picks.get(n) + 1);
    else if (e.target.closest('[data-pick-remove]')) { picks.delete(n); showOption([...picks.keys()].pop()); paint(); }
  });
  list.addEventListener('change', (e) => {
    const input = e.target.closest('[data-pick-qty]'); if (!input) return;
    const n = input.closest('[data-pick]').dataset.pick, q = Math.round(Number(input.value));
    setQty(n, Number.isFinite(q) && q > 0 ? q : picks.get(n));
  });
  list.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-pick-qty]')) { e.preventDefault(); e.target.blur(); } });
  addBtn.addEventListener('click', () => picks.forEach((q, n) => enquiry.add(it.slug, q, n)));

  paint();
  if (picks.size) showOption([...picks.keys()].pop());
  return paint;
}

export default function ({ inv, dims }) {
  const root = document.getElementById('item'), slug = new URLSearchParams(location.search).get('i');
  const it = inv.items.find((x) => x.slug === slug);
  if (!it) {
    document.title = 'Piece not found · Kekel Event Rentals';
    root.innerHTML = '<div class="wrap state" style="padding-top:12rem"><h1 class="lede">We could not find that piece.</h1><p>It may have been renamed or retired from the collection.</p><a class="btn" href="collections.html">Back to collections</a></div>';
    return;
  }
  const cat = byCategory(inv, it.category);
  setPageMeta({ title: `${it.name} Hire in Accra · Kekel Event Rentals`, description: `${it.name} for hire in Accra, Ghana: ${it.note}`, path: `/item.html?i=${it.slug}` });
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
