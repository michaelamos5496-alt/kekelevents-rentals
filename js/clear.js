// "Clear cart" with a built-in second step, so an accidental tap never wipes the cart.
import { enquiry } from './enquiry.js';

export const clearMarkup = (cls = 'btn btn--clear') => `<button class="${cls}" type="button" data-clear>Clear cart</button>`;

export function bindClear(root) {
  let timer;
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-clear]'); if (!b) return;
    if (b.dataset.armed) { clearTimeout(timer); enquiry.clear(); return; }
    b.dataset.armed = '1'; b.textContent = 'Tap again to clear';
    timer = setTimeout(() => { delete b.dataset.armed; b.textContent = 'Clear cart'; }, 4000);
  });
}
