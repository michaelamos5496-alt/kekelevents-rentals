// Site chrome: header, menu, footer, enquiry drawer, WhatsApp button. Injected so it lives in one place.
import { loadSite, loadInventory, esc, picture, loadImages, reveal } from './util.js';
import { enquiry, summary, totals, money, daysLabel } from './enquiry.js';
import { datesMarkup, bindDates } from './dates.js';
import { clearMarkup, bindClear } from './clear.js';
import { pop, menuIn, buttons } from './motion.js';

const NAV = [['index.html', 'Home'], ['collections.html', 'Rentals'], ['services.html', 'Styling'], ['portfolio.html', 'Portfolio'], ['about.html', 'About'], ['enquire.html', 'Enquire']];

export function whatsappUrl(site, text) {
  const n = (site.whatsapp.number || '').replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export async function initLayout() {
  const [site, inv, dims] = await Promise.all([loadSite(), loadInventory(), loadImages()]);
  enquiry.setLimits(Object.fromEntries(inv.items.map((i) => [i.slug, i.quantity])));
  const page = location.pathname.split('/').pop() || 'index.html';
  const mode = document.body.dataset.header, over = mode === 'over', tint = mode === 'tint'; // 'over': white text on a photo; 'tint': transparent on a grey hero
  if (!site.showPlaceholderTags) document.documentElement.classList.add('hide-placeholders');

  const navLinks = NAV.map(([href, label]) => `<a href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header${over ? ' site-header--over' : ''}" id="header">
      <div class="wrap site-header__bar">
        <a class="logo" href="index.html" aria-label="${esc(site.name)}, home"><img src="assets/logo.png" width="900" height="466" alt="Kekel Events &amp; Rentals"></a>
        <nav class="nav" aria-label="Primary">${navLinks}</nav>
        <div class="header-actions">
          <a class="icon-btn" href="collections.html" aria-label="Browse rentals"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></a>
          <button class="enquiry-link" type="button" data-open-enquiry aria-haspopup="dialog" aria-label="Your cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg><span class="enquiry-link__count" data-enquiry-count>0</span></button>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu"><span></span><span></span></button>
        </div>
      </div>
    </header>
    <div class="menu" id="menu" role="dialog" aria-modal="false" aria-label="Menu">
      <nav aria-label="Mobile">${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</nav>
      <div class="menu__foot"><span class="label">${esc(site.city)}</span><a href="https://instagram.com/${esc(site.instagram)}" rel="noopener">@${esc(site.instagram)}</a></div>
    </div>`);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="site-footer"><div class="wrap">
      <div class="grid footer__top">
        <div class="footer__brand"><a class="logo logo--footer" href="index.html"><img src="assets/logo.png" width="900" height="466" alt="Kekel Events &amp; Rentals" loading="lazy"></a><p>${esc(site.statement)}</p></div>
        <div class="footer__col"><h2>Rentals</h2><ul>${inv.categories.slice(0, 5).map((c) => `<li><a href="collections.html?c=${c.id}">${esc(c.name)}</a></li>`).join('')}</ul></div>
        <div class="footer__col"><h2>Studio</h2><ul><li><a href="about.html">About</a></li><li><a href="services.html">Styling</a></li><li><a href="portfolio.html">Portfolio</a></li><li><a href="enquire.html">Contact</a></li></ul></div>
        <div class="footer__col"><h2>Follow us</h2><ul><li><a href="https://instagram.com/${esc(site.instagram)}" rel="noopener">Instagram</a></li><li>${esc(site.city)}</li></ul></div>
        <div class="footer__col"><h2>Enquire</h2><ul><li>${esc(site.serviceArea)}</li></ul><a class="btn" href="enquire.html">Begin your enquiry</a></div>
      </div>
      <div class="footer__legal"><span>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved.</span><span>Designed and Developed by <a class="credit" href="https://theimagedept.vercel.app/index.html" target="_blank" rel="noopener">TheImagedept</a></span></div>
    </div></footer>
    <dialog class="drawer" id="drawer" aria-labelledby="drawer-title"><div class="drawer__inner">
      <div class="drawer__head"><h2 id="drawer-title">Your cart</h2><button class="drawer__close" type="button" data-close-enquiry aria-label="Close">×</button></div>
      <div class="drawer__body" id="drawer-body" aria-live="polite"></div>
      <div class="drawer__foot" id="drawer-foot"></div>
    </div></dialog>`);

  // Header turns solid after the hero (or immediately on pages without one).
  const header = document.getElementById('header');
  const solidify = () => header.classList.toggle('is-solid', !(over || tint) || scrollY > (over ? innerHeight * 0.7 : 24));
  solidify(); addEventListener('scroll', solidify, { passive: true });

  // Mobile menu
  const toggle = document.querySelector('.menu-toggle'), menu = document.getElementById('menu');
  const setMenu = (open) => { if (open) menuIn(); toggle.setAttribute('aria-expanded', open); menu.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open); };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 62rem)').addEventListener('change', (e) => e.matches && setMenu(false));

  // Enquiry drawer
  const drawer = document.getElementById('drawer'), body = document.getElementById('drawer-body'), foot = document.getElementById('drawer-foot');
  const counts = document.querySelectorAll('[data-enquiry-count]'), links = document.querySelectorAll('[data-open-enquiry]');
  function renderDrawer() {
    const list = enquiry.all();
    const grew = list.length > Number(counts[0]?.textContent || 0);
    counts.forEach((c) => { c.textContent = list.length; if (grew) pop(c); });
    links.forEach((l) => l.setAttribute('data-count', list.length));
    if (!list.length) {
      body.innerHTML = '<div class="drawer__empty"><p class="lede">Your cart is empty.</p><p>Add pieces from the rentals and they will wait here until you check out.</p></div>';
      foot.innerHTML = '<a class="btn" href="collections.html">Browse rentals</a>';
      return;
    }
    const t = totals(list, inv);
    body.innerHTML = t.lines.map(({ item: it, qty, unit, line }) => `<div class="drawer-item" data-slug="${esc(it.slug)}">
        <a class="media" href="item.html?i=${esc(it.slug)}">${picture(it.image, it.alt, dims[it.image], { sizes: '72px' })}</a>
        <div><h3>${esc(it.name)}</h3><small>${money(unit)} per day</small><div class="qty" role="group" aria-label="Quantity for ${esc(it.name)}"><button type="button" data-dec aria-label="Decrease">−</button><output>${qty}</output><button type="button" data-inc aria-label="Increase"${qty >= enquiry.max(it.slug) ? ' disabled' : ''}>+</button></div></div>
        <div class="drawer-item__side"><strong>${money(line)}</strong><button class="drawer-item__remove" type="button" data-remove aria-label="Remove ${esc(it.name)}">Remove</button></div></div>`).join('');
    foot.innerHTML = `${datesMarkup('dr')}
      <div class="sum-row"><span>Subtotal · ${daysLabel(t.days)}</span><strong>${money(t.subtotal)}</strong></div>
      <div class="sum-row sum-row--muted"><span>Delivery</span><span>${esc(site.cart.deliveryNote)}</span></div>
      <a class="btn btn--solid" href="enquire.html">Checkout</a>
      <a class="btn" href="cart.html">View cart</a>
      ${clearMarkup('link link--clear')}
      ${site.cart.ratesPlaceholder ? '<span class="ph-note">Placeholder rates</span>' : ''}
      <p>${esc(site.cart.paymentNote)}</p>`;
  }
  bindDates(foot); bindClear(foot);
  body.addEventListener('click', (e) => {
    const row = e.target.closest('.drawer-item'); if (!row) return;
    const slug = row.dataset.slug, cur = enquiry.all().find((x) => x.slug === slug);
    if (e.target.closest('[data-remove]')) enquiry.remove(slug);
    else if (e.target.closest('[data-inc]')) enquiry.setQty(slug, cur.qty + 1);
    else if (e.target.closest('[data-dec]')) enquiry.setQty(slug, cur.qty - 1);
  });
  let opener;
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-enquiry]')) { opener = e.target.closest('[data-open-enquiry]'); drawer.showModal(); }
    if (e.target.closest('[data-close-enquiry]')) drawer.close();
    if (e.target === drawer) drawer.close(); // click on backdrop
  });
  drawer.addEventListener('close', () => opener?.focus());
  enquiry.subscribe(renderDrawer); renderDrawer();

  buttons(); // GSAP hover, magnetic and press effects for every button

  // Page transitions and reveal
  document.documentElement.classList.add('js');
  reveal();
  return { site, inv, dims };
}
