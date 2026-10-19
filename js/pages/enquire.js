// Enquiry page: the cart summary, the form, and delivery (form endpoint if configured, otherwise WhatsApp).
import { esc, picture, reveal } from '../util.js';
import { enquiry, summary, totals, money, daysLabel } from '../enquiry.js';
import { whatsappUrl } from '../layout.js';

export default function ({ site, inv, dims }) {
  const $ = (id) => document.getElementById(id);
  const form = $('enq-form'), errBox = $('enq-error'), cartBox = $('enq-cart'), root = $('enq');
  const cfg = site.enquiry || {};

  // Select options come from data/site.json so they can be edited without touching code.
  $('f-type').innerHTML = '<option value="">Choose</option>' + (cfg.eventTypes || []).map((t) => `<option>${esc(t)}</option>`).join('');
  $('f-budget').innerHTML = '<option value="">Prefer not to say</option>' + (cfg.budgetRanges || []).map((t) => `<option>${esc(t)}</option>`).join('');
  $('f-date').min = new Date().toISOString().slice(0, 10);

  $('enq-insta').innerHTML = `Or follow <a href="https://instagram.com/${esc(site.instagram)}" rel="noopener">@${esc(site.instagram)}</a> on Instagram.`;
  $('enq-area').textContent = site.serviceArea;

  // ---- Cart summary (editable here, shared with the drawer through the same store) ----
  function renderCart() {
    const list = enquiry.all();
    if (!list.length) {
      cartBox.innerHTML = '<p class="enq__empty">Nothing in your cart yet. <a href="collections.html">Browse the rentals</a> to add pieces, or simply tell us what you need below.</p>';
    } else {
      const t = totals(list, inv);
      cartBox.innerHTML = t.lines.map(({ item: it, qty, unit, line }) => `<div class="enq-item" data-slug="${esc(it.slug)}">
          <a class="media" href="item.html?i=${esc(it.slug)}" tabindex="-1" aria-hidden="true">${picture(it.image, '', dims[it.image], { sizes: '56px' })}</a>
          <div><h3>${esc(it.name)}</h3><small class="muted">${money(unit)} per day</small><div class="qty" role="group" aria-label="Quantity for ${esc(it.name)}"><button type="button" data-dec aria-label="Decrease">−</button><output>${qty}</output><button type="button" data-inc aria-label="Increase"${qty >= enquiry.max(it.slug) ? ' disabled' : ''}>+</button></div></div>
          <div class="drawer-item__side"><strong>${money(line)}</strong><button class="drawer-item__remove" type="button" data-remove aria-label="Remove ${esc(it.name)}">Remove</button></div></div>`).join('')
        + `<div class="sum-row"><span>Rental period</span><span>${daysLabel(t.days)}</span></div>
        <div class="sum-row sum-row--total"><span>Estimated total</span><strong>${money(t.subtotal)}</strong></div>
        <a class="link" href="cart.html">Edit cart and rental days</a>
        ${site.cart.ratesPlaceholder ? '<span class="ph-note">Placeholder rates</span>' : ''}`;
    }
    $('enq-wa').href = whatsappUrl(site, buildMessage(readForm()));
  }
  cartBox.addEventListener('click', (e) => {
    const row = e.target.closest('.enq-item'); if (!row) return;
    const slug = row.dataset.slug, cur = enquiry.all().find((x) => x.slug === slug);
    if (e.target.closest('[data-remove]')) enquiry.remove(slug);
    else if (e.target.closest('[data-inc]')) enquiry.setQty(slug, cur.qty + 1);
    else if (e.target.closest('[data-dec]')) enquiry.setQty(slug, cur.qty - 1);
  });
  enquiry.subscribe(renderCart);

  // ---- Form ----
  const readForm = () => Object.fromEntries(new FormData(form).entries());
  function buildMessage(d) {
    const rows = [['Name', d.name], ['Email', d.email], ['Phone', d.phone], ['Event', [d.type, d.date].filter(Boolean).join(', ')], ['Venue', d.venue], ['Guests', d.guests], ['Budget', d.budget]]
      .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
    const pieces = summary(enquiry.all(), inv);
    return [site.whatsapp.message, rows, pieces && `Selected pieces:\n${pieces}`, d.message && `Message:\n${d.message}`].filter(Boolean).join('\n\n');
  }
  form.addEventListener('input', () => { $('enq-wa').href = whatsappUrl(site, buildMessage(readForm())); });

  function validate(d) {
    const errors = {};
    if (!d.name?.trim()) errors.name = 'Please enter your name.';
    if (!d.email?.trim()) errors.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.email = 'That email address does not look right.';
    if (!d.type) errors.type = 'Please choose an event type.';
    if (!d.date) errors.date = 'Please choose the event date.';
    else if (d.date < $('f-date').min) errors.date = 'The date needs to be in the future.';
    if (d.guests && !(Number(d.guests) >= 1)) errors.guests = 'Please enter a number of guests.';
    return errors;
  }
  function showErrors(errors) {
    form.querySelectorAll('.err').forEach((n) => n.remove());
    form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
    const keys = Object.keys(errors);
    errBox.hidden = !keys.length;
    if (!keys.length) return;
    errBox.textContent = 'Please check the highlighted fields.';
    keys.forEach((k) => {
      const input = form.elements[k]; input.setAttribute('aria-invalid', 'true');
      const msg = document.createElement('span'); msg.className = 'err'; msg.id = `err-${k}`; msg.textContent = errors[k];
      input.setAttribute('aria-describedby', msg.id); input.closest('.field').append(msg);
    });
    form.elements[keys[0]].focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = readForm();
    if (d.website) return; // honeypot: bots fill this in
    const errors = validate(d); showErrors(errors);
    if (Object.keys(errors).length) return;

    const btn = $('enq-submit'); btn.disabled = true; btn.textContent = 'Sending';
    const message = buildMessage(d);
    let via = 'whatsapp';
    try {
      if (cfg.endpoint) {
        const res = await fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...d, website: undefined, days: enquiry.days(), estimatedTotal: totals(enquiry.all(), inv).subtotal, pieces: enquiry.all().map((i) => ({ ...i, name: inv.items.find((x) => x.slug === i.slug)?.name })), summary: message }) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        via = 'form';
      }
    } catch (err) {
      console.error(err);
      errBox.hidden = false; errBox.textContent = 'We could not send that just now. Please try again, or use WhatsApp.';
      btn.disabled = false; btn.textContent = 'Send enquiry'; return;
    }
    if (via === 'whatsapp') window.open(whatsappUrl(site, message), '_blank', 'noopener');
    enquiry.clear();
    root.classList.add('is-sent');
    const done = $('enq-done'); done.hidden = false;
    done.innerHTML = via === 'form'
      ? `<span class="label">Thank you</span><h2>Your enquiry is with us.</h2><p>We will confirm availability and rates and send your quote to ${esc(d.email)}.</p><a class="btn" href="collections.html">Back to rentals</a>`
      : `<span class="label">One last step</span><h2>Send it on WhatsApp.</h2><p>We opened WhatsApp with your enquiry ready to send. Press send there and we will reply with availability and rates.</p><a class="btn btn--solid" href="${esc(whatsappUrl(site, message))}" target="_blank" rel="noopener">Open WhatsApp again</a><a class="btn" href="collections.html">Back to rentals</a>`;
    done.focus(); scrollTo({ top: 0, behavior: 'smooth' });
  });

  renderCart(); reveal();
}
