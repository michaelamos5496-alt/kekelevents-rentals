// Item card used on the collections page and in "pairs well with".
import { esc, picture } from '../util.js';
import { enquiry, money } from '../enquiry.js';

// Bag icon for the add button: a plus before adding, a tick once in the cart (swapped in CSS by aria-pressed).
// On phones the button shows only this icon; the words stay as its accessible name.
const ADD_ICON = '<svg class="add__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path class="add__plus" d="M12 11.5v5M9.5 14h5"/><path class="add__tick" d="m9.5 14 1.8 1.8 3.4-3.6"/></svg>';

// The second photo only shows on mouse hover, so touch screens never download it.
const canHover = matchMedia('(hover: hover)').matches;

export function card(it, cat, dims, delay = 0) {
  const on = enquiry.has(it.slug);
  return `<article class="card" data-reveal style="--d:${delay}ms" data-slug="${esc(it.slug)}">
    <a class="card__image media r-45" href="item.html?i=${esc(it.slug)}" tabindex="-1" aria-hidden="true" ${it.placeholder ? 'data-placeholder' : ''}>${picture(it.image, '', dims[it.image], { sizes: '(min-width: 75rem) 23vw, (min-width: 48rem) 31vw, 48vw' })}${canHover && it.gallery?.[0] ? `<span class="card__alt" aria-hidden="true">${picture(it.gallery[0], '', dims[it.gallery[0]], { sizes: '(min-width: 75rem) 23vw, (min-width: 48rem) 31vw, 48vw' })}</span>` : ''}</a>
    <div class="card__body">
      <span class="card__cat">${esc(cat?.name || '')}</span>
      <h3><a href="item.html?i=${esc(it.slug)}">${esc(it.name)}</a></h3>
      <p class="card__note">${esc(it.note)}</p>
      <div class="card__foot"><span class="card__qty"><strong class="card__price">${it.price ? money(it.price) : 'Price on request'}</strong>${it.price ? ' per day' : ''}<br>${it.quantity} to hire</span>
        ${it.options
          ? `<a class="add" href="item.html?i=${esc(it.slug)}" aria-label="Choose ${esc(it.options.label.toLowerCase())}, ${esc(it.name)}">${ADD_ICON}<span class="add__label">Choose ${esc(it.options.label.toLowerCase())}</span></a>`
          : `<button class="add" type="button" data-add="${esc(it.slug)}" aria-pressed="${on}" aria-label="${on ? 'Added' : 'Add'} ${esc(it.name)} to cart">${ADD_ICON}<span class="add__label">${on ? 'Added' : 'Add to cart'}</span></button>`}</div>
    </div></article>`;
}

/** One delegated handler keeps every "Add to cart" button in step with the list. Returns an unsubscribe for callers that re-bind on fresh content (e.g. the product modal). */
export function bindAdd(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    enquiry.toggle(b.dataset.add);
  });
  const sync = () => root.querySelectorAll('[data-add]').forEach((b) => {
    const on = enquiry.has(b.dataset.add);
    const name = b.closest('.card')?.querySelector('h3')?.textContent || '';
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', `${on ? 'Added' : 'Add'} ${name} to cart`);
    b.querySelector('.add__label').textContent = on ? 'Added' : 'Add to cart';
  });
  return enquiry.subscribe(sync);
}
