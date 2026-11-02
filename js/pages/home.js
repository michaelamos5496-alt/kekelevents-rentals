import { esc, loadJSON, reveal } from '../util.js';
import { heroIntro, parallax, settleImages } from '../motion.js';


export default async function ({ site, inv, dims }) {
  // Hero: rotating photo slides, cross-fading. The first slide is already in the markup (it's the LCP image).
  const { items: heroItems } = await loadJSON('data/hero-slides.json');
  const heroTrack = document.getElementById('heroSlides');
  // The other slides sit stacked on screen (invisible), so lazy loading would still fetch them all at once.
  // Instead each one downloads one slide ahead of its turn, and a slide that hasn't arrived yet is skipped.
  heroTrack.insertAdjacentHTML('beforeend', heroItems.slice(1).map((s) => {
    const d = dims[s.image] || {};
    const style = s.focalX != null ? ` style="--fx:${s.focalX}%"` : '';
    return `<img class="hero__slide" data-srcset="assets/images/${s.image}-960.jpg 960w, assets/images/${s.image}-1600.jpg 1600w" sizes="100vw" data-src="assets/images/${s.image}-1600.jpg" width="${d.w || 1672}" height="${d.h || 941}" alt="${esc(s.alt)}" decoding="async"${style}>`;
  }).join(''));
  const fetchSlide = (img) => { if (img?.dataset.src) { img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; } };
  const ready = (img) => !img.dataset.src && img.complete && img.naturalWidth > 0;
  if (heroItems.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let heroIdx = 0;
    const startNext = () => fetchSlide(heroTrack.children[1]);
    document.readyState === 'complete' ? startNext() : addEventListener('load', startNext, { once: true }); // after the page itself has loaded
    setInterval(() => {
      const slides = heroTrack.children;
      if (!ready(slides[(heroIdx + 1) % slides.length])) return; // still downloading: keep the current slide a little longer
      const current = slides[heroIdx];
      heroIdx = (heroIdx + 1) % slides.length;
      fetchSlide(slides[(heroIdx + 1) % slides.length]);
      current.classList.remove('is-active');
      current.classList.add('is-prev');
      slides[heroIdx].classList.add('is-active');
      setTimeout(() => {
        current.style.transition = 'none';
        current.classList.remove('is-prev');
        void current.offsetHeight;
        current.style.transition = '';
      }, 1600);
    }, 6000);
  }

  reveal();
  heroIntro();
  if (matchMedia('(min-width: 40rem)').matches) settleImages('.cat-card .media'); // on phones the cards are a plain slider
  parallax('.about__figure .media', 6);
}
