import { esc, loadJSON, reveal } from '../util.js';
import { heroIntro, parallax, settleImages } from '../motion.js';


export default async function ({ site, inv, dims }) {
  // Hero: rotating photo slides, cross-fading. The first slide is already in the markup (it's the LCP image).
  const { items: heroItems } = await loadJSON('data/hero-slides.json');
  const heroTrack = document.getElementById('heroSlides');
  heroTrack.insertAdjacentHTML('beforeend', heroItems.slice(1).map((s) => {
    const d = dims[s.image] || {};
    const style = s.focalX != null ? ` style="--fx:${s.focalX}%"` : '';
    return `<img class="hero__slide" srcset="assets/images/${s.image}-960.jpg 960w, assets/images/${s.image}-1600.jpg 1600w" sizes="100vw" src="assets/images/${s.image}-1600.jpg" width="${d.w || 1672}" height="${d.h || 941}" alt="${esc(s.alt)}" loading="lazy" decoding="async"${style}>`;
  }).join(''));
  if (heroItems.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let heroIdx = 0;
    setInterval(() => {
      const slides = heroTrack.children;
      const current = slides[heroIdx];
      heroIdx = (heroIdx + 1) % slides.length;
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
  settleImages('.cat-card .media');
  parallax('.about__figure .media', 6);
}
