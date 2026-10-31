// Cart page: line items with quantity steppers, rental days, and an order summary.
import { esc, picture, byCategory, reveal } from '../util.js';
import { enquiry, totals, money, daysLabel, periodLabel } from '../enquiry.js';
import { datesMarkup, bindDates } from '../dates.js';
import { clearMarkup, bindClear } from '../clear.js';
import { cartWhatsappUrl } from '../layout.js';

export default function ({ site, inv, dims }) {
  const root = document.getElementById('cart');

  function render() {
    const list = enquiry.all(), t = totals(list, inv);
    if (!t.lines.length) {
      root.innerHTML = `<div class="state"><p class="lede">Your cart is empty.</p><p>Add pieces from the rentals and they will wait here until you check out.</p><a class="btn btn--solid" href="collections.html">Browse rentals</a></div>`;
      return;
    }
    root.innerHTML = `
      <section class="cart__items" aria-label="Items in your cart">
        <div class="cart__head" aria-hidden="true"><span>Piece</span><span>Price per day</span><span>Quantity</span><span>Total</span></div>
        ${t.lines.map(({ item: it, key, option, qty, unit, line }) => `<article class="cart-line" data-key="${esc(key)}">
          <a class="cart-line__media media" href="item.html?i=${esc(it.slug)}">${picture(it.image, it.alt, dims[it.image], { sizes: '110px' })}</a>
          <div class="cart-line__info"><span class="card__cat">${esc(byCategory(inv, it.category).name)}</span><h2><a href="item.html?i=${esc(it.slug)}">${esc(it.name)}</a></h2>${option ? `<span class="line-opt">${esc(option)}</span>` : ''}<button class="cart-line__remove" type="button" data-remove aria-label="Remove ${esc(it.name)}">Remove</button></div>
          <div class="cart-line__price" data-label="Per day">${money(unit)}</div>
          <div class="qty" role="group" aria-label="Quantity for ${esc(it.name)}"><button type="button" data-dec aria-label="Decrease">−</button><input class="qty__input" type="number" inputmode="numeric" pattern="[0-9]*" min="1" max="${enquiry.max(it.slug)}" step="1" data-qty aria-label="Quantity for ${esc(it.name)}" value="${qty}"><button type="button" data-inc aria-label="Increase"${qty >= enquiry.max(it.slug) ? ' disabled' : ''}>+</button></div>
          <div class="cart-line__total" data-label="Total"><strong>${money(line)}</strong><small>${money(unit * qty)} per day × ${daysLabel(t.days)}</small></div>
        </article>`).join('')}
        <div class="cart__foot"><a class="link" href="collections.html">Continue browsing</a>${clearMarkup('btn btn--clear')}</div>
      </section>
      <aside class="cart__summary" aria-label="Order summary">
        <h2 class="enq__h">Order summary</h2>
        ${datesMarkup('cp')}
        <div class="sum-row"><span>${t.units} ${t.units === 1 ? 'piece' : 'pieces'} per day</span><span>${money(t.perDay)}</span></div>
        <div class="sum-row"><span>Subtotal · ${daysLabel(t.days)}</span><strong>${money(t.subtotal)}</strong></div>
        <div class="sum-row sum-row--muted"><span>Delivery and collection</span><span>${esc(site.cart.deliveryNote)}</span></div>
        <div class="sum-row sum-row--total"><span>Estimated total</span><strong>${money(t.subtotal)}</strong></div>
        <a class="btn btn--solid cart__checkout" href="${esc(cartWhatsappUrl(site, inv))}" target="_blank" rel="noopener">Checkout via WhatsApp</a>
        ${site.cart.ratesPlaceholder ? '<span class="ph-note">Placeholder rates</span>' : ''}
        <p class="muted cart__fine">${esc(site.cart.paymentNote)}</p>
      </aside>`;
  }

  root.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-line'), key = row?.dataset.key, cur = key && enquiry.get(key);
    if (e.target.closest('[data-remove]')) enquiry.remove(key);
    else if (e.target.closest('[data-inc]')) enquiry.setQty(key, cur.qty + 1);
    else if (e.target.closest('[data-dec]')) { cur.qty > 1 ? enquiry.setQty(key, cur.qty - 1) : enquiry.remove(key); }
  });
  root.addEventListener('change', (e) => {
    const input = e.target.closest('[data-qty]'); if (!input) return;
    const row = input.closest('.cart-line'), key = row?.dataset.key;
    const n = Math.round(Number(input.value));
    enquiry.setQty(key, Number.isFinite(n) && n > 0 ? n : 1);
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-qty]')) { e.preventDefault(); e.target.blur(); } });
  bindDates(root); bindClear(root);
  enquiry.subscribe(render); render(); reveal();
}
