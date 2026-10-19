// Item card used on the collections page and in "pairs well with".
import { esc, picture } from '../util.js';
import { enquiry, money } from '../enquiry.js';

export function card(it, cat, dims, delay = 0) {
  const on = enquiry.has(it.slug);
  return `<article class="card" data-reveal style="--d:${delay}ms" data-slug="${esc(it.slug)}">
    <a class="card__image media r-45" href="item.html?i=${esc(it.slug)}" tabindex="-1" aria-hidden="true" ${it.placeholder ? 'data-placeholder' : ''}>${picture(it.image, '', dims[it.image], { sizes: '(min-width: 75rem) 23vw, (min-width: 48rem) 31vw, 48vw' })}${it.gallery?.[0] ? `<span class="card__alt" aria-hidden="true">${picture(it.gallery[0], '', dims[it.gallery[0]], { sizes: '(min-width: 75rem) 23vw, (min-width: 48rem) 31vw, 48vw' })}</span>` : ''}</a>
    <div class="card__body">
      <span class="card__cat">${esc(cat?.name || '')}</span>
      <h3><a href="item.html?i=${esc(it.slug)}">${esc(it.name)}</a></h3>
      <p class="card__note">${esc(it.note)}</p>
      <div class="card__foot"><span class="card__qty"><strong class="card__price">${money(it.price)}</strong> per day<br>${it.quantity} to hire</span>
        <button class="add" type="button" data-add="${esc(it.slug)}" aria-pressed="${on}">${on ? 'Added' : 'Add to cart'}</button></div>
    </div></article>`;
}

/** One delegated handler keeps every "Add to cart" button in step with the list. */
export function bindAdd(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    enquiry.toggle(b.dataset.add);
  });
  const sync = () => root.querySelectorAll('[data-add]').forEach((b) => {
    const on = enquiry.has(b.dataset.add);
    b.setAttribute('aria-pressed', on);
    b.textContent = b.dataset.long ? (on ? 'Added to cart' : 'Add to cart') : (on ? 'Added' : 'Add to cart');
  });
  enquiry.subscribe(sync);
}
