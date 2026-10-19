// GSAP motion layer. Everything degrades gracefully: with reduced motion, or if GSAP failed to load,
// the CSS reveal fallback in site.css (and util.reveal's IntersectionObserver) takes over.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const hasGsap = () => !reduced && typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

let ready = false;
function setup() {
  if (ready) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });
  document.documentElement.classList.add('gsap'); // turns the CSS reveal transition off so GSAP owns the properties
  addEventListener('load', () => ScrollTrigger.refresh());
  ready = true;
}

/** Soft fade-and-rise for [data-reveal] elements as they enter the viewport. Returns false if GSAP is unavailable. */
export function reveal(root = document) {
  if (!hasGsap()) return false;
  setup();
  const els = [...root.querySelectorAll('[data-reveal]:not([data-g]):not(.hero [data-reveal])')];
  if (!els.length) return true;
  els.forEach((e) => (e.dataset.g = '1'));
  gsap.set(els, { y: 32 });
  ScrollTrigger.batch(els, {
    start: 'top 92%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, overwrite: true, clearProps: 'transform' }),
  });
  buttonsIn(root);
  return true;
}

/** Home hero: headline rises word by word, supporting text follows, photo unveils and drifts on scroll. */
export function heroIntro() {
  if (!hasGsap()) return false;
  setup();
  const hero = document.querySelector('.hero'); if (!hero) return false;
  const h1 = hero.querySelector('.hero__statement');
  const label = hero.querySelector('.label'), sub = hero.querySelector('.hero__sub'), actions = hero.querySelector('.hero__actions');
  const media = hero.querySelector('.hero__image'), pic = media?.querySelector('picture');

  h1.setAttribute('aria-label', h1.textContent.trim());
  h1.innerHTML = h1.textContent.trim().split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
  gsap.set(hero.querySelectorAll('[data-reveal]'), { opacity: 1, y: 0 });
  gsap.set([label, sub, actions], { opacity: 0, y: 24 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero__statement .w > span', { yPercent: 110, duration: 1.1, stagger: 0.08 }, 0.1)
    .to(label, { opacity: 1, y: 0, duration: 0.9 }, 0)
    .to([sub, actions], { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.7);
  const heroBtns = [...hero.querySelectorAll('.btn')];
  gsap.set(heroBtns, { clipPath: 'inset(0 100% 0 0 round 999px)' });
  tl.to(heroBtns, { clipPath: 'inset(0 0% 0 0 round 0px)', duration: 1, ease: 'power4.out', clearProps: 'clipPath' }, 1.0);
  if (media) {
    tl.fromTo(media, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1.4, ease: 'power4.inOut' }, 0.1)
      .fromTo(pic, { scale: 1.25 }, { scale: 1.08, duration: 1.8 }, 0.1);
    gsap.to(pic, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  return true;
}

/** Gentle vertical drift on a photograph inside its frame while the page scrolls. */
export function parallax(sel, amount = 8) {
  if (!hasGsap()) return;
  setup();
  document.querySelectorAll(sel).forEach((frame) => {
    const pic = frame.querySelector('picture'); if (!pic) return;
    gsap.fromTo(pic, { yPercent: -amount, scale: 1.14 }, { yPercent: amount, scale: 1.14, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/** Photographs settle from a slight zoom as their tile scrolls into view. */
export function settleImages(sel) {
  if (!hasGsap()) return;
  setup();
  document.querySelectorAll(sel).forEach((frame) => {
    const pic = frame.querySelector('picture'); if (!pic || pic.dataset.g) return; pic.dataset.g = '1';
    gsap.fromTo(pic, { scale: 1.18 }, { scale: 1, duration: 1.6, scrollTrigger: { trigger: frame, start: 'top 92%', once: true } });
  });
}

/** Fade the text of a freshly shown slide in. */
export function slideIn(slide) {
  if (!hasGsap() || !slide) return;
  gsap.fromTo(slide.querySelectorAll('.slide__text > *'), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, overwrite: true });
}

/** Small pop on the cart badge when something is added. */
export function pop(el) {
  if (!hasGsap() || !el) return;
  gsap.fromTo(el, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', overwrite: true });
}

/** Menu links rise in as the mobile menu opens. */
export function menuIn() {
  if (!hasGsap()) return;
  gsap.from('.menu nav a, .menu__foot', { y: 36, opacity: 0, duration: 0.8, stagger: 0.06, delay: 0.1, clearProps: 'all' });
}

/** Testimonial text eases in line by line as it becomes the active quote. */
export function quoteIn(fig) {
  if (!hasGsap() || !fig) return;
  gsap.fromTo(fig.querySelectorAll('blockquote, figcaption > *'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, overwrite: true });
}

/* ---------------------------------------------------------------------------------------------
   Buttons: fill sweep, square-to-pill shape morph, magnetic pull and press feedback (hover and
   pointer only), plus a clip-path wipe as buttons scroll into view. All delegated, so buttons
   rendered later (cards, drawer, form states) animate too.
   --------------------------------------------------------------------------------------------- */
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const SHAPED = '.btn, .slider__btn';
const cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

function prep(b) {
  if (b._fx) return;
  b._fx = true; b.classList.add('fx');
  const f = document.createElement('span'); f.className = 'btn__fill'; f.setAttribute('aria-hidden', 'true');
  b.prepend(f); gsap.set(f, { scaleX: 0, transformOrigin: 'left center' }); b._fill = f;
  b._qx = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'power3' }); b._qy = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'power3' });
}

export function buttons() {
  if (!hasGsap() || !FINE) return;
  setup();
  const round = (b) => (b.classList.contains('slider__btn') ? '50%' : '999px');

  document.addEventListener('pointerover', (e) => {
    const b = e.target.closest(SHAPED);
    if (b && !b.disabled && !b.contains(e.relatedTarget)) {
      prep(b); gsap.killTweensOf([b._fill, b]);
      gsap.set(b._fill, { transformOrigin: 'left center' });
      gsap.to(b._fill, { scaleX: 1, duration: 0.55, ease: 'power3.out' });
      gsap.to(b, { color: cssVar(b, '--fill-text'), borderRadius: round(b), duration: 0.55, ease: 'power3.out' });
    }
    const t = e.target.closest('.add, .link, .arrow-link');
    if (t && !t.contains(e.relatedTarget)) gsap.to(t, { x: 5, duration: 0.4, overwrite: 'auto' });
  });

  document.addEventListener('pointerout', (e) => {
    const b = e.target.closest(SHAPED);
    if (b && b._fx && !b.contains(e.relatedTarget)) {
      gsap.killTweensOf([b._fill, b]);
      gsap.set(b._fill, { transformOrigin: 'right center' });
      gsap.to(b._fill, { scaleX: 0, duration: 0.55, ease: 'power3.out' });
      b._qx(0); b._qy(0);
      gsap.to(b, { color: cssVar(b, '--base-text'), borderRadius: 0, scale: 1, duration: 0.55, ease: 'power3.out', onComplete: () => gsap.set(b, { clearProps: 'color,borderRadius,scale' }) });
    }
    const t = e.target.closest('.add, .link, .arrow-link');
    if (t && !t.contains(e.relatedTarget)) gsap.to(t, { x: 0, duration: 0.4, overwrite: 'auto' });
  });

  document.addEventListener('pointermove', (e) => {
    const b = e.target.closest('.btn'); if (!b || !b._fx) return;
    const r = b.getBoundingClientRect(), clamp = (v) => Math.max(-8, Math.min(8, v));
    b._qx(clamp((e.clientX - (r.left + r.width / 2)) * 0.18)); b._qy(clamp((e.clientY - (r.top + r.height / 2)) * 0.25));
  });
  document.addEventListener('pointerdown', (e) => { const b = e.target.closest(SHAPED); if (b && !b.disabled) gsap.to(b, { scale: 0.96, duration: 0.15, ease: 'power2.out' }); });
  document.addEventListener('pointerup', (e) => { const b = e.target.closest(SHAPED); if (b) gsap.to(b, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); });
  document.addEventListener('click', (e) => { const a = e.target.closest('.add'); if (a) gsap.fromTo(a, { scale: 1.12 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }); });
}

/** Buttons wipe in from the left, their corners easing from pill to square, as they scroll into view. */
export function buttonsIn(root = document) {
  if (!hasGsap()) return;
  setup();
  const els = [...root.querySelectorAll('main .btn:not([data-bi]):not(.hero .btn), footer .btn:not([data-bi])')];
  if (!els.length) return;
  els.forEach((b) => (b.dataset.bi = '1'));
  const from = 'inset(0 100% 0 0 round 999px)', to = 'inset(0 0% 0 0 round 0px)';
  gsap.set(els, { clipPath: from });
  ScrollTrigger.batch(els, { start: 'top 94%', once: true, onEnter: (batch) => gsap.to(batch, { clipPath: to, duration: 1, ease: 'power4.out', stagger: 0.1, delay: 0.2, clearProps: 'clipPath' }) });
}
