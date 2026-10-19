// Rental date pickers shared by the cart page and the cart drawer. Days are calculated from the two dates.
import { enquiry, daysLabel } from './enquiry.js';

export function datesMarkup(id) {
  const d = enquiry.dates(), min = enquiry.today();
  return `<div class="dates" data-dates>
    <div class="field"><label for="${id}-s">Start date</label><input id="${id}-s" type="date" data-date-start value="${d.start}" min="${min}"></div>
    <div class="field"><label for="${id}-e">Return date</label><input id="${id}-e" type="date" data-date-end value="${d.end}" min="${d.start || min}"></div>
    <p class="dates__days" aria-live="polite">${enquiry.hasDates() ? `<strong>${daysLabel(enquiry.days())}</strong> of rental` : 'Choose both dates to calculate your rental days.'}</p>
  </div>`;
}

/** Delegated change handler: updates the stored dates from whichever picker the visitor used. */
export function bindDates(root) {
  root.addEventListener('change', (e) => {
    const box = e.target.closest('[data-dates]'); if (!box) return;
    const s = box.querySelector('[data-date-start]').value, en = box.querySelector('[data-date-end]').value;
    if (e.target.matches('[data-date-start]') && s && !en) enquiry.setDates(s, s); // picking a start day alone assumes a 1-day rental
    else enquiry.setDates(s, en);
  });
}
