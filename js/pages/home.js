import { esc, loadJSON, reveal } from '../util.js';
import { heroIntro, parallax, settleImages, quoteIn } from '../motion.js';


export default async function ({ site, inv, dims }) {
  // Hero: rotating photo slides, cross-fading. The first slide is already in the markup (it's the LCP image).
  const { items: heroItems } = await loadJSON('data/hero-slides.json');
  const heroTrack = document.getElementById('heroSlides');
  heroTrack.insertAdjacentHTML('beforeend', heroItems.slice(1).map((s) => {
    const d = dims[s.image] || {};
    return `<img class="hero__slide" srcset="assets/images/${s.image}-960.jpg 960w, assets/images/${s.image}-1600.jpg 1600w" sizes="100vw" src="assets/images/${s.image}-1600.jpg" width="${d.w || 1672}" height="${d.h || 941}" alt="${esc(s.alt)}" loading="lazy" decoding="async">`;
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

  // Testimonials: one quote at a time, crossfaded. Manual only, so nobody loses a line mid-read.
  const { items: quotes } = await loadJSON('data/testimonials.json');
  const stage = document.getElementById('testimonials'), tdots = document.getElementById('t-dots');
  stage.innerHTML = quotes.map((q, n) => `<figure class="tquote${n ? '' : ' is-active'}" role="group" aria-roledescription="slide" aria-label="${n + 1} of ${quotes.length}" ${n ? 'aria-hidden="true"' : ''}>
      <blockquote><p>“${esc(q.quote)}”</p></blockquote>
      <figcaption><span class="tquote__author">${esc(q.author)}</span><span class="label">${esc(q.event)}</span>${q.placeholder ? '<span class="ph-note">Placeholder: not a real client</span>' : ''}</figcaption>
    </figure>`).join('');
  tdots.innerHTML = quotes.map((_, n) => `<button type="button" data-t="${n}" aria-label="Show testimonial ${n + 1}" aria-current="${n === 0}"></button>`).join('');
  let tcur = 0;
  const tshow = (i) => {
    const next = (i + quotes.length) % quotes.length; if (next === tcur) return;
    const figs = [...stage.children], from = figs[tcur], to = figs[next];
    tcur = next;
    from.classList.remove('is-active'); from.setAttribute('aria-hidden', 'true');
    to.classList.add('is-active'); to.removeAttribute('aria-hidden');
    [...tdots.children].forEach((d, n) => d.setAttribute('aria-current', n === tcur));
    quoteIn(to);
  };
  document.getElementById('t-prev').addEventListener('click', () => tshow(tcur - 1));
  document.getElementById('t-next').addEventListener('click', () => tshow(tcur + 1));
  tdots.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) tshow(Number(b.dataset.t)); });
  stage.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') tshow(tcur + 1); if (e.key === 'ArrowLeft') tshow(tcur - 1); });

  reveal();
  heroIntro();
  settleImages('.cat-card .media');
  parallax('.about__figure .media', 6);
}
