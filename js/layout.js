// Site chrome: header, menu, footer, enquiry drawer, product modal, WhatsApp button. Injected so it lives in one place.
import { loadSite, loadInventory, esc, picture, loadImages, reveal, stocked, byCategory } from './util.js';
import { enquiry, summary, totals, money, daysLabel } from './enquiry.js';
import { datesMarkup, bindDates } from './dates.js';
import { clearMarkup, bindClear } from './clear.js';
import { pop, menuIn, buttons } from './motion.js';
import { buildCard, bindCard } from './pages/item.js';

const NAV = [['index.html', 'Home'], ['collections.html', 'Rentals'], ['services.html', 'Styling'], ['portfolio.html', 'Portfolio'], ['about.html', 'About'], ['enquire.html', 'Enquire']];

export function whatsappUrl(site, text) {
  const n = (site.whatsapp.number || '').replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

/** WhatsApp link pre-filled with the cart contents, for checking out without the enquiry form. */
export function cartWhatsappUrl(site, inv) {
  const pieces = summary(enquiry.all(), inv);
  return whatsappUrl(site, [site.whatsapp.message, pieces && `Selected pieces:\n${pieces}`].filter(Boolean).join('\n\n'));
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
        <a class="logo" href="index.html" aria-label="${esc(site.name)}, home"><img class="logo__light" src="assets/logo.png" width="1063" height="703" alt="Kekel Events &amp; Rentals"><img class="logo__dark" src="assets/logo-white.png" width="1063" height="703" alt="Kekel Events &amp; Rentals"></a>
        <nav class="nav" aria-label="Primary">${navLinks}</nav>
        <div class="header-actions">
          <a class="icon-btn" href="collections.html" aria-label="Browse rentals"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></a>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to dark mode"><svg class="theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg><svg class="theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg></button>
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
        <div class="footer__brand"><a class="logo logo--footer" href="index.html"><img src="assets/logo-white.png" width="1063" height="703" alt="Kekel Events &amp; Rentals" loading="lazy"></a><p>${esc(site.statement)}</p></div>
        <div class="footer__col"><h2>Rentals</h2><ul>${stocked(inv).slice(0, 5).map((c) => `<li><a href="collections.html?c=${c.id}">${esc(c.name)}</a></li>`).join('')}</ul></div>
        <div class="footer__col"><h2>Studio</h2><ul><li><a href="about.html">About</a></li><li><a href="services.html">Styling</a></li><li><a href="portfolio.html">Portfolio</a></li><li><a href="enquire.html">Contact</a></li></ul></div>
        <div class="footer__col"><h2>Follow us</h2><ul><li><a href="https://instagram.com/${esc(site.instagram)}" rel="noopener">Instagram</a></li><li>${esc(site.city)}</li></ul></div>
        <div class="footer__col"><h2>Enquire</h2><ul><li>${esc(site.serviceArea)}</li><li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li><li><a href="tel:${esc(site.phone.replace(/\s/g, ''))}">${esc(site.phone)}</a></li></ul><a class="btn" href="enquire.html">Begin your enquiry</a></div>
      </div>
      <div class="footer__legal"><span>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved.</span><span>Designed and Developed by <a class="credit" href="https://theimagedept.vercel.app/index.html" target="_blank" rel="noopener">TheImagedept</a></span></div>
    </div></footer>
    <dialog class="drawer" id="drawer" aria-labelledby="drawer-title"><div class="drawer__inner">
      <div class="drawer__head"><h2 id="drawer-title">Your cart</h2><button class="drawer__close" type="button" data-close-enquiry aria-label="Close">×</button></div>
      <div class="drawer__body" id="drawer-body" aria-live="polite"></div>
      <div class="drawer__foot" id="drawer-foot"></div>
    </div></dialog>
    <dialog class="product-modal" id="product-modal" aria-label="Piece details">
      <div class="pdp__card">
        <button class="product-modal__close" type="button" data-close-product aria-label="Close">×</button>
        <div id="product-modal-body"></div>
      </div>
    </dialog>`);

  // Header turns solid after the hero (or immediately on pages without one).
  const header = document.getElementById('header');
  const solidify = () => header.classList.toggle('is-solid', !(over || tint) || scrollY > (over ? innerHeight * 0.7 : 24));
  solidify(); addEventListener('scroll', solidify, { passive: true });

  // Dark/light mode: localStorage holds an explicit choice; with none, CSS alone follows the system preference.
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const effectiveTheme = () => {
    const stored = localStorage.getItem('kekel.theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const paintThemeLabel = () => themeToggle.setAttribute('aria-label', effectiveTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  paintThemeLabel();
  themeToggle.addEventListener('click', () => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('kekel.theme', next); } catch { /* storage unavailable: theme reverts to system on reload */ }
    document.documentElement.setAttribute('data-theme', next);
    paintThemeLabel();
  });

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
  let drawerPainted = false;
  function renderDrawer() {
    const list = enquiry.all(), t = totals(list, inv);
    const grew = drawerPainted && list.length > Number(counts[0]?.textContent || 0);
    drawerPainted = true;
    counts.forEach((c) => { c.textContent = list.length; if (grew) pop(c); });
    links.forEach((l) => l.setAttribute('data-count', list.length));
    if (!t.lines.length) {
      body.innerHTML = '<div class="drawer__empty"><p class="lede">Your cart is empty.</p><p>Add pieces from the rentals and they will wait here until you check out.</p></div>';
      foot.innerHTML = '<a class="btn" href="collections.html">Browse rentals</a>';
      return;
    }
    body.innerHTML = t.lines.map(({ item: it, qty, unit, line }) => `<div class="drawer-item" data-slug="${esc(it.slug)}">
        <a class="media" href="item.html?i=${esc(it.slug)}">${picture(it.image, it.alt, dims[it.image], { sizes: '72px' })}</a>
        <div><h3>${esc(it.name)}</h3><small>${money(unit)} per day</small><div class="qty" role="group" aria-label="Quantity for ${esc(it.name)}"><button type="button" data-dec aria-label="Decrease"${qty <= 1 ? ' disabled' : ''}>−</button><output>${qty}</output><button type="button" data-inc aria-label="Increase"${qty >= enquiry.max(it.slug) ? ' disabled' : ''}>+</button></div></div>
        <div class="drawer-item__side"><strong>${money(line)}</strong><button class="drawer-item__remove" type="button" data-remove aria-label="Remove ${esc(it.name)}">Remove</button></div></div>`).join('');
    foot.innerHTML = `${datesMarkup('dr')}
      <div class="sum-row"><span>Subtotal · ${daysLabel(t.days)}</span><strong>${money(t.subtotal)}</strong></div>
      <div class="sum-row sum-row--muted"><span>Delivery</span><span>${esc(site.cart.deliveryNote)}</span></div>
      <a class="btn btn--solid" href="${esc(cartWhatsappUrl(site, inv))}" target="_blank" rel="noopener">Checkout via WhatsApp</a>
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
  // Product modal: any link to a piece opens it as a popup instead of navigating, on every page.
  const productModal = document.getElementById('product-modal'), productBody = document.getElementById('product-modal-body');
  let productOpener, productUnsub;
  function openProduct(slug) {
    const it = inv.items.find((x) => x.slug === slug);
    if (!it) return;
    if (drawer.open) drawer.close(); // only one popup at a time
    productUnsub?.();
    productBody.innerHTML = buildCard(it, byCategory(inv, it.category), dims);
    productUnsub = bindCard(productBody, it, dims);
    productModal.showModal();
    reveal(productBody);
  }

  let opener;
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-enquiry]')) { opener = e.target.closest('[data-open-enquiry]'); if (productModal.open) productModal.close(); drawer.showModal(); }
    if (e.target.closest('[data-close-enquiry]')) drawer.close();
    if (e.target === drawer) drawer.close(); // click on backdrop

    const a = e.target.closest('a[href^="item.html?i="]');
    if (a && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && a.target !== '_blank') {
      e.preventDefault();
      productOpener = a;
      openProduct(new URL(a.href, location.href).searchParams.get('i'));
    }
    if (e.target.closest('[data-close-product]')) productModal.close();
    if (e.target === productModal) productModal.close(); // click on backdrop
  });
  drawer.addEventListener('close', () => opener?.focus());
  productModal.addEventListener('close', () => { productUnsub?.(); productUnsub = null; productOpener?.focus(); });
  enquiry.subscribe(renderDrawer); renderDrawer();

  buttons(); // GSAP hover, magnetic and press effects for every button

  // Page transitions and reveal
  document.documentElement.classList.add('js');
  reveal();
  return { site, inv, dims };
}
