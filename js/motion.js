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
